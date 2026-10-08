import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('POST /api/auth/register (integração)', () => {
  let app: INestApplication;
  const prisma = {
    usuario: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const corpoValido = {
    nome: 'Maria da Silva',
    email: 'maria@mdca.org.br',
    senha: 'senhaSegura123',
    organizacaoId: 1,
  };

  // Simula o banco: devolve o que foi gravado, acrescentando o id.
  function simularCriacao() {
    prisma.usuario.create.mockImplementation(async ({ data }) => ({
      id: 7,
      ativo: true,
      ...data,
    }));
  }

  function registrar(corpo: Record<string, unknown> = corpoValido) {
    return request(app.getHttpServer()).post('/api/auth/register').send(corpo);
  }

  // Cada teste ganha uma aplicação nova para o contador do rate limit não
  // vazar de um teste para o outro.
  beforeEach(async () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('cadastro', () => {
    it('cria o usuário, responde 201 e devolve token + usuário sem o hash', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      simularCriacao();

      const res = await registrar();

      expect(res.status).toBe(201);
      expect(res.body.usuario).toEqual({
        id: 7,
        nome: 'Maria da Silva',
        email: 'maria@mdca.org.br',
        perfil: 'administrativo',
      });
      expect(res.body.usuario.senhaHash).toBeUndefined();
      expect(res.body.senhaHash).toBeUndefined();
      const payload = app.get(JwtService).verify(res.body.accessToken);
      expect(payload).toMatchObject({
        sub: 7,
        perfil: 'administrativo',
        organizacaoId: 1,
      });
    });

    it('grava a senha como hash bcrypt, nunca em texto puro', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      simularCriacao();

      await registrar();

      const { data } = prisma.usuario.create.mock.calls[0][0];
      expect(data.senhaHash).toBeDefined();
      expect(data.senhaHash).not.toBe(corpoValido.senha);
      expect(data.senha).toBeUndefined();
      expect(await bcrypt.compare(corpoValido.senha, data.senhaHash)).toBe(true);
    });

    it('ignora o perfil enviado e usa sempre o perfil padrão', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      simularCriacao();

      const res = await registrar({ ...corpoValido, perfil: 'coordenador' });

      expect(res.status).toBe(201);
      expect(res.body.usuario.perfil).toBe('administrativo');
      const { data } = prisma.usuario.create.mock.calls[0][0];
      expect(data.perfil).toBe('administrativo');
    });

    it('normaliza o e-mail (trim + minúsculas) antes de consultar e gravar', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      simularCriacao();

      await registrar({ ...corpoValido, email: '  Maria@MDCA.org.br ' });

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'maria@mdca.org.br' } }),
      );
      const { data } = prisma.usuario.create.mock.calls[0][0];
      expect(data.email).toBe('maria@mdca.org.br');
    });

    it('o token devolvido no cadastro funciona em GET /api/auth/me', async () => {
      const usuarioCriado = {
        id: 7,
        organizacaoId: 1,
        nome: 'Maria da Silva',
        email: 'maria@mdca.org.br',
        perfil: 'administrativo',
        ativo: true,
      };
      // 1ª chamada: checagem de e-mail duplicado; 2ª: a strategy do JWT no /me.
      prisma.usuario.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue(usuarioCriado);
      simularCriacao();

      const cadastro = await registrar();
      const me = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${cadastro.body.accessToken}`);

      expect(me.status).toBe(200);
      expect(me.body).toEqual(cadastro.body.usuario);
    });
  });

  describe('e-mail duplicado', () => {
    it('responde 409 e não tenta criar quando o e-mail já existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 1 });

      const res = await registrar();

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Já existe um usuário com este e-mail.');
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });

    it('responde 409 também na corrida (violação de unicidade no banco)', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'teste',
        }),
      );

      const res = await registrar();

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Já existe um usuário com este e-mail.');
    });
  });

  describe('validação', () => {
    it.each([
      ['senha curta', { senha: '1234567' }],
      ['senha acima de 72 caracteres', { senha: 'a'.repeat(73) }],
      ['e-mail inválido', { email: 'isso-nao-e-email' }],
      ['nome vazio', { nome: '' }],
      ['sem organizacaoId', { organizacaoId: undefined }],
    ])('%s responde 400 sem tocar no banco', async (_descricao, alteracao) => {
      const res = await registrar({ ...corpoValido, ...alteracao });

      expect(res.status).toBe(400);
      expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });
  });

  describe('rate limit', () => {
    it('register bloqueia com 429 a partir da 4ª tentativa no mesmo minuto', async () => {
      // E-mail já existente: cada tentativa é barata e responde 409.
      prisma.usuario.findUnique.mockResolvedValue({ id: 1 });

      for (let i = 0; i < 3; i++) {
        expect((await registrar()).status).toBe(409);
      }

      expect((await registrar()).status).toBe(429);
    });

    it('login conta por e-mail: outro e-mail não é bloqueado junto', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);
      const login = (email: string) =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, senha: 'qualquer' });

      for (let i = 0; i < 5; i++) {
        expect((await login('a@mdca.org.br')).status).toBe(401);
      }
      expect((await login('a@mdca.org.br')).status).toBe(429);

      // Mesmo IP, e-mail diferente: contador próprio.
      expect((await login('b@mdca.org.br')).status).toBe(401);
    });

    it('login trata "A@x" e "a@x" como o mesmo e-mail no limite', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);
      const login = (email: string) =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email, senha: 'qualquer' });

      for (let i = 0; i < 5; i++) {
        await login(i % 2 === 0 ? 'A@mdca.org.br' : 'a@mdca.org.br');
      }

      expect((await login('a@MDCA.org.br')).status).toBe(429);
    });
  });
});