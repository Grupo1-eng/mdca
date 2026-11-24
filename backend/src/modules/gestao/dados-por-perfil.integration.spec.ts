import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Dados por perfil nas listagens da Gestão (questionário da MDCA, itens 2 e 3):
// - GET /api/educandos: cadastro inteiro só para técnicos e coordenação;
//   educador e administrativo recebem id, nome, situação e vínculos.
// - GET /api/iniciativas: orçamento total só para a coordenação.
describe('Dados por perfil (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    educando: { findMany: jest.fn() },
    projeto: { findMany: jest.fn() },
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
    prisma.educando.findMany.mockResolvedValue([]);
    prisma.projeto.findMany.mockResolvedValue([]);
  });

  function get(rota: string) {
    return request(app.getHttpServer())
      .get(rota)
      .set('Authorization', `Bearer ${token}`);
  }

  describe('GET /api/educandos', () => {
    it.each(['educador', 'administrativo'])(
      '%s recebe só id, nome, situação e vínculos',
      async (perfil) => {
        logadoComo(perfil);

        const res = await get('/api/educandos');

        expect(res.status).toBe(200);
        const args = prisma.educando.findMany.mock.calls[0][0];
        expect(args.include).toBeUndefined();
        expect(Object.keys(args.select).sort()).toEqual(
          ['educandoProjetos', 'id', 'nome', 'situacaoAtual'],
        );
        // Mesmo filtro de organização e de situação da listagem completa.
        expect(args.where).toMatchObject({ organizacaoId: 3, situacaoAtual: 'ativo' });
      },
    );

    it.each(['coordenador', 'tecnico_servico_social', 'tecnico_psicologia'])(
      '%s recebe o cadastro inteiro',
      async (perfil) => {
        logadoComo(perfil);

        const res = await get('/api/educandos?nome=ana&apenasAtivos=false');

        expect(res.status).toBe(200);
        const args = prisma.educando.findMany.mock.calls[0][0];
        expect(args.select).toBeUndefined();
        expect(args.include).toHaveProperty('educandoProjetos');
        expect(args.where).toEqual({
          organizacaoId: 3,
          nome: { contains: 'ana', mode: 'insensitive' },
        });
      },
    );

    it('perfil do Financeiro continua bloqueado', async () => {
      logadoComo('gestor_financeiro');

      const res = await get('/api/educandos');

      expect(res.status).toBe(403);
      expect(prisma.educando.findMany).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/iniciativas', () => {
    it('a coordenação recebe o orçamento total', async () => {
      logadoComo('coordenador');

      await get('/api/iniciativas');

      const args = prisma.projeto.findMany.mock.calls[0][0];
      expect(args.select).toMatchObject({ orcamentoTotal: true, nome: true });
    });

    it.each([
      'tecnico_servico_social',
      'tecnico_psicologia',
      'educador',
      'administrativo',
    ])('%s não recebe o orçamento', async (perfil) => {
      logadoComo(perfil);

      const res = await get('/api/iniciativas');

      expect(res.status).toBe(200);
      const args = prisma.projeto.findMany.mock.calls[0][0];
      expect(args.select).not.toHaveProperty('orcamentoTotal');
      expect(args.select).toMatchObject({ id: true, nome: true, tipo: true });
      expect(args.where).toEqual({ organizacaoId: 3 });
    });
  });
});
