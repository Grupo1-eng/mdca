import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

// GET /api/painel (US05): filtros por período e iniciativa, isolamento por
// organização, orçamento só para a coordenação.
describe('Painel da Gestão (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    projeto: { findMany: jest.fn() },
    encontro: { findMany: jest.fn() },
    evolucao: { findMany: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  function logadoComo(perfil: string) {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Usuário',
      email: 'usuario@mdca.org.br',
      perfil,
      ativo: true,
    });
  }

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
    logadoComo('coordenador');
    prisma.projeto.findMany.mockResolvedValue([
      { id: 5, nome: 'Reforço', tipo: 'PROJETO', orcamentoTotal: '200' },
    ]);
    prisma.encontro.findMany.mockResolvedValue([
      {
        atividade: { projetoId: 5 },
        frequencias: [
          { educandoId: 1, presencaAusencia: 'presente' },
          { educandoId: 2, presencaAusencia: 'ausente' },
        ],
      },
    ]);
    prisma.evolucao.findMany.mockResolvedValue([
      { educandoId: 3, projetoId: null, educando: { educandoProjetos: [{ projetoId: 5 }] } },
    ]);
  });

  function get(rota: string) {
    return request(app.getHttpServer())
      .get(rota)
      .set('Authorization', `Bearer ${token}`);
  }

  it('devolve os indicadores do período, filtrando pela organização', async () => {
    const res = await get('/api/painel?inicio=2026-11-01&fim=2026-11-30');

    expect(res.status).toBe(200);
    expect(res.body.filtros).toEqual({ inicio: '2026-11-01', fim: '2026-11-30', iniciativaId: null });
    expect(res.body.totais).toMatchObject({
      educandosAtendidos: 2,
      atendimentosRegistrados: 1,
      encontrosRealizados: 1,
      frequenciaMedia: 0.5,
      orcamentoTotal: 200,
    });
    expect(prisma.projeto.findMany.mock.calls[0][0].where).toEqual({ organizacaoId: 3 });
    const whereEncontro = prisma.encontro.findMany.mock.calls[0][0].where;
    expect(whereEncontro).toMatchObject({
      situacao: 'realizado',
      atividade: { projeto: { organizacaoId: 3 } },
    });
    expect(whereEncontro.dataInicio.gte.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(whereEncontro.dataInicio.lt.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(prisma.evolucao.findMany.mock.calls[0][0].where).toMatchObject({
      educando: { organizacaoId: 3 },
    });
    // Encontro guarda só o dia (meia-noite UTC); evolução guarda o instante,
    // filtrado no calendário de Brasília.
    const whereEvolucao = prisma.evolucao.findMany.mock.calls[0][0].where;
    expect(whereEvolucao.dataInicio.gte.toISOString()).toBe('2026-11-01T03:00:00.000Z');
    expect(whereEvolucao.dataInicio.lt.toISOString()).toBe('2026-12-01T03:00:00.000Z');
  });

  it('filtra por iniciativa nas três consultas', async () => {
    const res = await get('/api/painel?inicio=2026-11-01&fim=2026-11-30&iniciativaId=5');

    expect(res.status).toBe(200);
    expect(prisma.projeto.findMany.mock.calls[0][0].where).toEqual({ organizacaoId: 3, id: 5 });
    expect(prisma.encontro.findMany.mock.calls[0][0].where.atividade).toMatchObject({ projetoId: 5 });
    expect(prisma.evolucao.findMany.mock.calls[0][0].where.OR).toHaveLength(2);
  });

  it('iniciativa de outra organização responde 404', async () => {
    prisma.projeto.findMany.mockResolvedValue([]);

    const res = await get('/api/painel?inicio=2026-11-01&fim=2026-11-30&iniciativaId=99');

    expect(res.status).toBe(404);
    expect(prisma.encontro.findMany).not.toHaveBeenCalled();
  });

  it.each(['tecnico_servico_social', 'educador', 'administrativo'])(
    '%s consulta, mas sem orçamento',
    async (perfil) => {
      logadoComo(perfil);
      prisma.projeto.findMany.mockResolvedValue([{ id: 5, nome: 'Reforço', tipo: 'PROJETO' }]);

      const res = await get('/api/painel?inicio=2026-11-01&fim=2026-11-30');

      expect(res.status).toBe(200);
      expect(prisma.projeto.findMany.mock.calls[0][0].select).not.toHaveProperty('orcamentoTotal');
      expect(res.body.totais).not.toHaveProperty('orcamentoTotal');
      expect(res.body.porIniciativa[0]).not.toHaveProperty('orcamentoTotal');
    },
  );

  it('perfil do Financeiro não acessa', async () => {
    logadoComo('gestor_financeiro');
    const res = await get('/api/painel?inicio=2026-11-01&fim=2026-11-30');
    expect(res.status).toBe(403);
  });

  it.each([
    ['sem datas', '/api/painel'],
    ['data em outro formato', '/api/painel?inicio=01/11/2026&fim=2026-11-30'],
    ['início depois do fim', '/api/painel?inicio=2026-12-01&fim=2026-11-30'],
    ['dia que não existe', '/api/painel?inicio=2026-11-01&fim=2026-11-31'],
    ['iniciativa inválida', '/api/painel?inicio=2026-11-01&fim=2026-11-30&iniciativaId=abc'],
  ])('recusa %s (400)', async (_caso, rota) => {
    const res = await get(rota);
    expect(res.status).toBe(400);
    expect(prisma.encontro.findMany).not.toHaveBeenCalled();
  });
});
