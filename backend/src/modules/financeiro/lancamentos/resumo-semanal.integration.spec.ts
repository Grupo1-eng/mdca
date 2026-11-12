import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

describe('GET /api/lancamentos/resumo-semanal (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: { findMany: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    token = app.get(JwtService).sign({ sub: 7 });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  function logadoComo(perfil: string) {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Teste',
      email: 'teste@mdca.org.br',
      perfil,
      ativo: true,
    });
  }

  const get = (query: string) =>
    request(app.getHttpServer())
      .get(`/api/lancamentos/resumo-semanal${query}`)
      .set('Authorization', `Bearer ${token}`);

  it('devolve as semanas do mês com entradas, saídas e saldo', async () => {
    logadoComo('gestor_financeiro');
    prisma.lancamento.findMany.mockResolvedValue([
      {
        tipo: 'entrada',
        valor: '1000.00',
        dataCompetencia: new Date('2026-11-03T00:00:00.000Z'),
        dataPagamento: null,
        criadoEm: new Date('2026-10-01T00:00:00.000Z'),
      },
      {
        tipo: 'saida',
        valor: '250.50',
        dataCompetencia: new Date('2026-11-10T00:00:00.000Z'),
        dataPagamento: null,
        criadoEm: new Date('2026-10-01T00:00:00.000Z'),
      },
    ]);

    const res = await get('?mes=2026-11');

    expect(res.status).toBe(200);
    expect(res.body.mes).toBe('2026-11');
    expect(res.body.semanas).toHaveLength(5);
    expect(res.body.semanas[0]).toMatchObject({ semana: 1, entradas: '1000.00', saidas: '0.00' });
    expect(res.body.semanas[1]).toMatchObject({ semana: 2, entradas: '0.00', saidas: '250.50' });
    expect(res.body.totais).toEqual({ entradas: '1000.00', saidas: '250.50', saldo: '749.50' });
  });

  it('busca no banco só os lançamentos do mês pedido', async () => {
    logadoComo('analista_financeiro');
    prisma.lancamento.findMany.mockResolvedValue([]);

    await get('?mes=2026-11');

    const { where } = prisma.lancamento.findMany.mock.calls[0][0];
    const intervalo = {
      gte: new Date('2026-11-01T00:00:00.000Z'),
      lt: new Date('2026-12-01T00:00:00.000Z'),
    };
    expect(where.OR[0]).toEqual({ dataCompetencia: intervalo });
  });

  it('sem projetoId não filtra por projeto', async () => {
    logadoComo('analista_financeiro');
    prisma.lancamento.findMany.mockResolvedValue([]);

    await get('?mes=2026-11');

    expect(prisma.lancamento.findMany.mock.calls[0][0].where).not.toHaveProperty('projetoId');
  });

  it('com projetoId traz só os lançamentos daquele projeto', async () => {
    logadoComo('analista_financeiro');
    prisma.lancamento.findMany.mockResolvedValue([]);

    const res = await get('?mes=2026-11&projetoId=12');

    expect(res.status).toBe(200);
    const { where } = prisma.lancamento.findMany.mock.calls[0][0];
    expect(where.projetoId).toBe(12);
    expect(where.conta).toEqual({ organizacaoId: 3 });
  });

  it('projetoId=nenhum traz só os lançamentos sem projeto', async () => {
    logadoComo('analista_financeiro');
    prisma.lancamento.findMany.mockResolvedValue([]);

    await get('?mes=2026-11&projetoId=nenhum');

    expect(prisma.lancamento.findMany.mock.calls[0][0].where.projetoId).toBeNull();
  });

  it.each(['abc', '-1', '1.5', '0'])('recusa projetoId inválido (%s) com 400', async (projetoId) => {
    logadoComo('analista_financeiro');

    const res = await get(`?mes=2026-11&projetoId=${projetoId}`);

    expect(res.status).toBe(400);
    expect(prisma.lancamento.findMany).not.toHaveBeenCalled();
  });

  it.each(['', '?mes=novembro', '?mes=2026-13', '?mes=2026-1', '?mes=2026-11-01'])(
    'recusa mês ausente ou inválido (%s) com 400',
    async (query) => {
      logadoComo('gestor_financeiro');

      const res = await get(query);

      expect(res.status).toBe(400);
      expect(prisma.lancamento.findMany).not.toHaveBeenCalled();
    },
  );

  it('perfil sem acesso ao financeiro recebe 403', async () => {
    logadoComo('educador');

    const res = await get('?mes=2026-11');

    expect(res.status).toBe(403);
    expect(prisma.lancamento.findMany).not.toHaveBeenCalled();
  });

  it('sem token recebe 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/lancamentos/resumo-semanal?mes=2026-11');

    expect(res.status).toBe(401);
  });
});
