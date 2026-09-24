import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Sobe a aplicação inteira (guards, pipes e rotas reais) trocando só o acesso
// ao banco por um fake, para testar o comportamento HTTP da autenticação.
describe('Autenticação (integração)', () => {
  let app: INestApplication;
  const prisma = {
    usuario: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('rotas sem token', () => {
    it.each([
      '/api/lancamentos',
      '/api/contas-financeiras',
      '/api/categorias-financeiras',
      '/api/contatos',
      '/api/fontes-de-recurso',
      '/api/orcamentos',
      '/api/projetos',
      '/api/organizacoes',
      '/api/auditorias',
      '/api/usuarios',
    ])('GET %s responde 401', async (rota) => {
      const res = await request(app.getHttpServer()).get(rota);
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/login continua público', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ninguem@mdca.org.br', senha: 'x' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('E-mail ou senha inválidos.');
    });
  });

  describe('GET /api/auth/me', () => {
    const usuarioAtivo = {
      id: 7,
      organizacaoId: 1,
      nome: 'Maria da Silva',
      email: 'maria@mdca.org.br',
      perfil: 'administrativo',
      ativo: true,
    };

    function tokenPara(id: number) {
      return app.get(JwtService).sign({
        sub: id,
        email: usuarioAtivo.email,
        perfil: usuarioAtivo.perfil,
        organizacaoId: usuarioAtivo.organizacaoId,
      });
    }

    it('responde 401 sem token', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('devolve o usuário do token, sem o hash da senha', async () => {
      prisma.usuario.findUnique.mockResolvedValue(usuarioAtivo);

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenPara(7)}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 7,
        nome: 'Maria da Silva',
        email: 'maria@mdca.org.br',
        perfil: 'administrativo',
      });
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 7 } }),
      );
    });

    it('recusa o token de um usuário inativado depois do login', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ ...usuarioAtivo, ativo: false });

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenPara(7)}`);

      expect(res.status).toBe(401);
    });

    it('recusa o token de um usuário que não existe mais', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenPara(99)}`);

      expect(res.status).toBe(401);
    });

    it('recusa token assinado com outra chave', async () => {
      const forjado = new JwtService({ secret: 'outra-chave' }).sign({ sub: 7 });

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forjado}`);

      expect(res.status).toBe(401);
    });
  });
});
