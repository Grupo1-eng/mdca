import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('POST /api/auth/login (integração)', () => {
  let app: INestApplication;
  const prisma = {
    usuario: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  let usuario: {
    id: number;
    organizacaoId: number;
    nome: string;
    email: string;
    senhaHash: string;
    perfil: string;
    ativo: boolean;
  };

  // Cada teste ganha uma aplicação nova para o contador do rate limit não
  // vazar de um teste para o outro.
  beforeEach(async () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    jest.resetAllMocks();
    usuario = {
      id: 7,
      organizacaoId: 1,
      nome: 'Maria da Silva',
      email: 'maria@mdca.org.br',
      senhaHash: await bcrypt.hash('senha-correta', 4),
      perfil: 'administrativo',
      ativo: true,
    };
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

  function login(senha: string) {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: usuario.email, senha });
  }

  it('com a senha certa devolve um token válido para o usuário', async () => {
    prisma.usuario.findFirst.mockResolvedValue(usuario);

    const res = await login('senha-correta');

    expect(res.status).toBe(200);
    expect(res.body.usuario).toEqual({
      id: 7,
      nome: 'Maria da Silva',
      email: 'maria@mdca.org.br',
      perfil: 'administrativo',
    });
    expect(res.body.usuario.senhaHash).toBeUndefined();
    const payload = app.get(JwtService).verify(res.body.accessToken);
    expect(payload).toMatchObject({ sub: 7, perfil: 'administrativo', organizacaoId: 1 });
  });

  it('com a senha errada responde 401', async () => {
    prisma.usuario.findFirst.mockResolvedValue(usuario);

    const res = await login('senha-errada');

    expect(res.status).toBe(401);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('não procura usuários inativos', async () => {
    prisma.usuario.findFirst.mockResolvedValue(null);

    await login('senha-correta');

    expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
      where: { email: usuario.email, ativo: true },
    });
  });

  it('bloqueia com 429 a partir da 6ª tentativa no mesmo minuto', async () => {
    prisma.usuario.findFirst.mockResolvedValue(usuario);

    for (let i = 0; i < 5; i++) {
      expect((await login('senha-errada')).status).toBe(401);
    }

    const bloqueada = await login('senha-correta');
    expect(bloqueada.status).toBe(429);
  });

  it('não aplica o limite do login às outras rotas', async () => {
    prisma.usuario.findFirst.mockResolvedValue(usuario);
    prisma.usuario.findUnique.mockResolvedValue(usuario);
    const token = (await login('senha-correta')).body.accessToken;

    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });
});
