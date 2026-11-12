import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Eventos de segurança que entram no log do financeiro: login de quem tem
// acesso a ele, acessos negados a rotas financeiras e mudanças de usuário que
// dão ou tiram esse acesso.
describe('Auditoria de eventos de segurança (integração)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const senhaHash = bcrypt.hashSync('senha-correta', 4);
  const prisma = {
    usuario: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    auditoria: { create: jest.fn() },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const base = { organizacaoId: 3, ativo: true, criadoEm: new Date('2026-01-01T00:00:00Z') };
  const coordenador = { ...base, id: 1, nome: 'Coord', email: 'coord@mdca.org.br', perfil: 'coordenador' };
  const analista = { ...base, id: 2, nome: 'Ana', email: 'ana@mdca.org.br', perfil: 'analista_financeiro' };
  const educador = { ...base, id: 3, nome: 'Edu', email: 'edu@mdca.org.br', perfil: 'educador' };
  const usuarios = [coordenador, analista, educador];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
    prisma.usuario.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(usuarios.find((u) => u.id === where.id) ?? null),
    );
    prisma.usuario.findFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        usuarios.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
      ),
    );
  });

  function como(usuario: { id: number }) {
    const token = jwt.sign({ sub: usuario.id });
    return {
      get: (rota: string) => request(app.getHttpServer()).get(rota).set('Authorization', `Bearer ${token}`),
      put: (rota: string, corpo: object) =>
        request(app.getHttpServer()).put(rota).set('Authorization', `Bearer ${token}`).send(corpo),
      patch: (rota: string) => request(app.getHttpServer()).patch(rota).set('Authorization', `Bearer ${token}`),
    };
  }

  function login(email: string, senha: string, comHash = true) {
    const usuario = usuarios.find((u) => u.email === email);
    prisma.usuario.findFirst.mockResolvedValue(usuario && comHash ? { ...usuario, senhaHash } : null);
    return request(app.getHttpServer()).post('/api/auth/login').send({ email, senha });
  }

  function auditado() {
    expect(prisma.auditoria.create).toHaveBeenCalledTimes(1);
    return prisma.auditoria.create.mock.calls[0][0].data;
  }

  describe('login', () => {
    it('login de perfil financeiro é registrado com o próprio usuário como autor', async () => {
      const res = await login(analista.email, 'senha-correta');

      expect(res.status).toBe(200);
      expect(auditado()).toEqual(
        expect.objectContaining({
          acao: 'login',
          recursoTipo: 'usuario',
          recursoId: '2',
          usuarioId: 2,
          perfil: 'analista_financeiro',
          organizacaoId: 3,
          resumo: 'Login realizado (Ana)',
        }),
      );
    });

    it('senha errada de perfil financeiro vira login_falhou e a resposta não muda', async () => {
      const res = await login(analista.email, 'senha-errada');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('E-mail ou senha inválidos.');
      expect(auditado()).toEqual(expect.objectContaining({ acao: 'login_falhou', usuarioId: 2 }));
      expect(JSON.stringify(auditado())).not.toContain('senha-errada');
    });

    it('login de perfil sem acesso ao financeiro não entra no log', async () => {
      const res = await login(educador.email, 'senha-correta');

      expect(res.status).toBe(200);
      expect(prisma.auditoria.create).not.toHaveBeenCalled();
    });

    it('e-mail inexistente não é registrado', async () => {
      const res = await login('ninguem@mdca.org.br', 'qualquer', false);

      expect(res.status).toBe(401);
      expect(prisma.auditoria.create).not.toHaveBeenCalled();
    });

    it('falha ao gravar o log não impede o login', async () => {
      prisma.auditoria.create.mockRejectedValue(new Error('banco fora'));

      const res = await login(analista.email, 'senha-correta');

      expect(res.status).toBe(200);
    });
  });

  describe('acesso negado', () => {
    it('rota do financeiro negada registra o padrão da rota, sem o id', async () => {
      const res = await como(educador).get('/api/lancamentos/55?x=1');

      expect(res.status).toBe(403);
      expect(auditado()).toEqual(
        expect.objectContaining({
          acao: 'acesso_negado',
          recursoTipo: 'rota',
          recursoId: 'GET /api/lancamentos/:id',
          usuarioId: 3,
          perfil: 'educador',
          organizacaoId: 3,
        }),
      );
    });

    it('analista tentando ler o log de auditoria é registrado', async () => {
      const res = await como(analista).get('/api/auditorias');

      expect(res.status).toBe(403);
      expect(auditado()).toEqual(expect.objectContaining({ recursoId: 'GET /api/auditorias' }));
    });

    it('rota que não é do financeiro não entra no log do financeiro', async () => {
      const res = await como(analista).put('/api/usuarios/3', { nome: 'X' });

      expect(res.status).toBe(403);
      expect(prisma.auditoria.create).not.toHaveBeenCalled();
    });
  });

  describe('usuários', () => {
    it('dar perfil financeiro a alguém vira mudar_perfil', async () => {
      prisma.usuario.update.mockResolvedValue({ ...educador, perfil: 'gestor_financeiro' });

      const res = await como(coordenador).put('/api/usuarios/3', { perfil: 'gestor_financeiro' });

      expect(res.status).toBe(200);
      expect(auditado()).toEqual(
        expect.objectContaining({
          acao: 'mudar_perfil',
          recursoTipo: 'usuario',
          recursoId: '3',
          resumo: 'Usuário #3 (Edu): perfil educador → gestor_financeiro',
          usuarioId: 1,
          perfil: 'coordenador',
        }),
      );
    });

    it('redefinir senha de perfil financeiro registra só que mudou', async () => {
      prisma.usuario.update.mockResolvedValue(analista);

      await como(coordenador).put('/api/usuarios/2', { senha: 'nova-senha-123' });

      const data = auditado();
      expect(data.alteracoes).toEqual({ senha: { alterado: true } });
      expect(JSON.stringify(data)).not.toContain('nova-senha-123');
    });

    it('inativar usuário financeiro é registrado', async () => {
      prisma.usuario.update.mockResolvedValue({ ...analista, ativo: false });

      await como(coordenador).patch('/api/usuarios/2/inativar');

      expect(auditado()).toEqual(expect.objectContaining({ acao: 'inativar', recursoId: '2' }));
    });

    it('alteração de usuário sem perfil financeiro não entra no log', async () => {
      prisma.usuario.update.mockResolvedValue({ ...educador, nome: 'Eduardo' });

      await como(coordenador).put('/api/usuarios/3', { nome: 'Eduardo' });

      expect(prisma.auditoria.create).not.toHaveBeenCalled();
    });
  });

});
