import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

// Regras da tela de Usuários: só a coordenação gerencia, sempre dentro da
// própria organização, e sem conseguir se trancar para fora do sistema.
describe('/api/usuarios (integração)', () => {
  let app: INestApplication;
  const prisma = {
    usuario: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const coordenador = { id: 7, organizacaoId: 3, nome: 'Coord', email: 'coord@mdca.org.br', perfil: 'coordenador', ativo: true };
  const administrativo = { id: 8, organizacaoId: 3, nome: 'Adm', email: 'adm@mdca.org.br', perfil: 'administrativo', ativo: true };
  const usuarios = [coordenador, administrativo];

  const novo = { nome: 'Maria', email: 'maria@mdca.org.br', senha: 'senha-segura', perfil: 'educador' };

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
    // JwtStrategy carrega o usuário do token por id.
    prisma.usuario.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(usuarios.find((u) => u.id === where.id) ?? null),
    );
    // O service busca sempre dentro da organização do token.
    prisma.usuario.findFirst.mockImplementation(({ where }) =>
      Promise.resolve(usuarios.find((u) => u.id === where.id && u.organizacaoId === where.organizacaoId) ?? null),
    );
    prisma.usuario.create.mockImplementation(({ data }) => Promise.resolve({ id: 20, ...data }));
    prisma.usuario.update.mockImplementation(({ where, data }) => Promise.resolve({ ...coordenador, id: where.id, ...data }));
  });

  function como(usuario: { id: number }) {
    const token = app.get(JwtService).sign({ sub: usuario.id });
    return {
      get: (rota: string) => request(app.getHttpServer()).get(rota).set('Authorization', `Bearer ${token}`),
      post: (rota: string, corpo: object) =>
        request(app.getHttpServer()).post(rota).set('Authorization', `Bearer ${token}`).send(corpo),
      put: (rota: string, corpo: object) =>
        request(app.getHttpServer()).put(rota).set('Authorization', `Bearer ${token}`).send(corpo),
      patch: (rota: string) => request(app.getHttpServer()).patch(rota).set('Authorization', `Bearer ${token}`),
    };
  }

  describe('criar', () => {
    it('coordenação cria usuário na própria organização, ignorando a do corpo', async () => {
      const res = await como(coordenador).post('/api/usuarios', { ...novo, organizacaoId: 999 });

      expect(res.status).toBe(201);
      const { data } = prisma.usuario.create.mock.calls[0][0];
      expect(data.organizacaoId).toBe(3);
    });

    it('guarda só o hash da senha', async () => {
      await como(coordenador).post('/api/usuarios', novo);

      const { data } = prisma.usuario.create.mock.calls[0][0];
      expect(data.senha).toBeUndefined();
      expect(data.senhaHash).toMatch(/^\$2[aby]\$/);
    });

    it('outros perfis não criam usuários', async () => {
      const res = await como(administrativo).post('/api/usuarios', novo);
      expect(res.status).toBe(403);
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });

    it('exige senha com pelo menos 8 caracteres', async () => {
      const res = await como(coordenador).post('/api/usuarios', { ...novo, senha: 'curta' });
      expect(res.status).toBe(400);
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    it('lista só os usuários da organização do token', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);

      await como(administrativo).get('/api/usuarios');

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizacaoId: 3 } }),
      );
    });
  });

  describe('editar e inativar', () => {
    it('não encontra usuário de outra organização', async () => {
      const res = await como(coordenador).put('/api/usuarios/50', { nome: 'X' });
      expect(res.status).toBe(404);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('coordenação edita usuário da própria organização', async () => {
      const res = await como(coordenador).put('/api/usuarios/8', { perfil: 'educador' });
      expect(res.status).toBe(200);
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 8 }, data: { perfil: 'educador' } }),
      );
    });

    it('não permite inativar a própria conta', async () => {
      const res = await como(coordenador).patch('/api/usuarios/7/inativar');
      expect(res.status).toBe(400);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('não permite tirar o próprio perfil de coordenação', async () => {
      const res = await como(coordenador).put('/api/usuarios/7', { perfil: 'administrativo' });
      expect(res.status).toBe(400);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('não permite se desativar pela edição', async () => {
      const res = await como(coordenador).put('/api/usuarios/7', { ativo: false });
      expect(res.status).toBe(400);
    });

    it('permite editar o próprio nome e senha', async () => {
      const res = await como(coordenador).put('/api/usuarios/7', { nome: 'Coordenação', senha: 'nova-senha-123' });
      expect(res.status).toBe(200);
    });

    it('reativa um usuário inativo', async () => {
      const res = await como(coordenador).put('/api/usuarios/8', { ativo: true });
      expect(res.status).toBe(200);
    });
  });
});
