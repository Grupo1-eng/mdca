import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

// Listas do painel dos técnicos: encaminhamentos em aberto e últimos
// atendimentos. Só técnicos e coordenação; filtradas pela organização; sem
// nenhum texto de atendimento ou encaminhamento.
describe('Painel dos técnicos (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    encaminhamento: { findMany: jest.fn() },
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
    prisma.encaminhamento.findMany.mockResolvedValue([]);
    prisma.evolucao.findMany.mockResolvedValue([]);
  });

  function get(rota: string) {
    return request(app.getHttpServer())
      .get(rota)
      .set('Authorization', `Bearer ${token}`);
  }

  it('encaminhamentos em aberto: não efetivados, da organização, sem descrição', async () => {
    logadoComo('tecnico_psicologia');

    const res = await get('/api/encaminhamentos/em-aberto');

    expect(res.status).toBe(200);
    const args = prisma.encaminhamento.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      educando: { is: { organizacaoId: 3 } },
      NOT: { situacaoAtual: { equals: 'efetivado', mode: 'insensitive' } },
    });
    expect(args.select).not.toHaveProperty('descricao');
    expect(args.select).not.toHaveProperty('acompanhamentos');
    expect(args.orderBy).toEqual({ dataEncaminhamento: 'asc' });
    expect(args.take).toBe(8);
  });

  it('últimos atendimentos: da organização, sem texto', async () => {
    logadoComo('tecnico_servico_social');

    const res = await get('/api/evolucoes/recentes');

    expect(res.status).toBe(200);
    const args = prisma.evolucao.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ educando: { is: { organizacaoId: 3 } } });
    for (const campo of ['descricao', 'titulo', 'intervencaoUsuario', 'intervencaoFamilia']) {
      expect(args.select).not.toHaveProperty(campo);
    }
    expect(args.orderBy).toEqual({ dataInicio: 'desc' });
  });

  it.each(['educador', 'administrativo', 'gestor_financeiro'])(
    '%s não acessa as listas (403)',
    async (perfil) => {
      logadoComo(perfil);
      expect((await get('/api/encaminhamentos/em-aberto')).status).toBe(403);
      expect((await get('/api/evolucoes/recentes')).status).toBe(403);
    },
  );
});
