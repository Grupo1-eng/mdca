import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

// Rota direta de acompanhamentos: encaminhamento ligado a evolução sigilosa
// de outro serviço não entrega as observações (MDCA, perguntas 24 e 25).
describe('Acompanhamentos e sigilo (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    encaminhamento: { findFirst: jest.fn() },
    acompanhamentoEncaminhamento: { findMany: jest.fn(), findFirst: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const sigilosaDoSS = {
    sigiloso: true,
    profissionalId: 10,
    profissional: { perfil: 'tecnico_servico_social' },
  };
  const acompanhamento = { id: 1, encaminhamentoId: 8, situacao: 'pendente', data: '2026-11-20', observacao: 'Obs. sigilosa' };

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
    prisma.encaminhamento.findFirst.mockResolvedValue({ id: 8, evolucao: sigilosaDoSS });
    prisma.acompanhamentoEncaminhamento.findMany.mockResolvedValue([acompanhamento]);
    prisma.acompanhamentoEncaminhamento.findFirst.mockResolvedValue({
      ...acompanhamento,
      encaminhamento: { evolucao: sigilosaDoSS },
    });
  });

  function get(rota: string) {
    return request(app.getHttpServer())
      .get(rota)
      .set('Authorization', `Bearer ${token}`);
  }

  it('lista: Psicologia não recebe a observação', async () => {
    logadoComo('tecnico_psicologia');
    const res = await get('/api/acompanhamentos-encaminhamento?encaminhamentoId=8');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ id: 1, situacao: 'pendente', observacao: null, conteudoOculto: true });
  });

  it('lista: o mesmo serviço e a coordenação recebem tudo', async () => {
    for (const perfil of ['tecnico_servico_social', 'coordenador']) {
      logadoComo(perfil);
      const res = await get('/api/acompanhamentos-encaminhamento?encaminhamentoId=8');
      expect(res.body[0]).toMatchObject({ observacao: 'Obs. sigilosa', conteudoOculto: false });
    }
  });

  it('encaminhamento sem evolução ligada: todos os técnicos recebem tudo', async () => {
    logadoComo('tecnico_psicologia');
    prisma.encaminhamento.findFirst.mockResolvedValue({ id: 8, evolucao: null });
    const res = await get('/api/acompanhamentos-encaminhamento?encaminhamentoId=8');
    expect(res.body[0].observacao).toBe('Obs. sigilosa');
  });

  it('GET :id aplica a mesma regra e não devolve o encaminhamento', async () => {
    logadoComo('tecnico_psicologia');
    const res = await get('/api/acompanhamentos-encaminhamento/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, observacao: null, conteudoOculto: true });
    expect(res.body).not.toHaveProperty('encaminhamento');
  });
});
