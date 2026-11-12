import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Revisão de 2026-11-05: ninguém de fora cria conta sozinho, e só os perfis
// responsáveis alteram projetos e o cadastro da organização.
describe('Permissões de cadastro (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn(), create: jest.fn() },
    projeto: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    organizacao: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    auditoria: { create: jest.fn() },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const projeto = { id: 5, organizacaoId: 3, nome: 'Oficinas', tipo: 'PROJETO', status: 'Ativo' };
  const organizacao = { id: 3, nome: 'MDCA' };

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
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
    prisma.projeto.findMany.mockResolvedValue([projeto]);
    prisma.projeto.findUnique.mockResolvedValue(projeto);
    prisma.projeto.create.mockResolvedValue(projeto);
    prisma.projeto.update.mockResolvedValue(projeto);
    prisma.projeto.delete.mockResolvedValue(projeto);
    prisma.organizacao.findMany.mockResolvedValue([organizacao]);
    prisma.organizacao.findUnique.mockResolvedValue(organizacao);
    prisma.organizacao.create.mockResolvedValue(organizacao);
    prisma.organizacao.update.mockResolvedValue(organizacao);
    prisma.organizacao.delete.mockResolvedValue(organizacao);
  });

  function logadoComo(perfil: string) {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7, organizacaoId: 3, nome: 'Teste', email: 'teste@mdca.org.br', perfil, ativo: true,
    });
  }

  function enviar(metodo: 'get' | 'post' | 'put' | 'delete', rota: string, corpo?: object) {
    const req = request(app.getHttpServer())[metodo](rota).set('Authorization', `Bearer ${token}`);
    return corpo ? req.send(corpo) : req;
  }

  describe('cadastro público', () => {
    it('POST /api/auth/register não existe: ninguém cria a própria conta', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send({
        nome: 'Invasor', email: 'invasor@exemplo.com', senha: 'senha-forte-123', organizacaoId: 3,
      });

      expect(res.status).toBe(404);
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });
  });

  describe('projetos', () => {
    const novo = { nome: 'Oficinas', tipo: 'PROJETO', status: 'Ativo' };

    it.each(['educador', 'tecnico_servico_social', 'tecnico_psicologia'])(
      '%s consulta, mas não cria, edita nem exclui projetos',
      async (perfil) => {
        logadoComo(perfil);

        expect((await enviar('get', '/api/projetos')).status).toBe(200);
        expect((await enviar('get', '/api/projetos/5')).status).toBe(200);
        expect((await enviar('post', '/api/projetos', novo)).status).toBe(403);
        expect((await enviar('put', '/api/projetos/5', { nome: 'X' })).status).toBe(403);
        expect((await enviar('delete', '/api/projetos/5')).status).toBe(403);
        expect(prisma.projeto.create).not.toHaveBeenCalled();
        expect(prisma.projeto.update).not.toHaveBeenCalled();
        expect(prisma.projeto.delete).not.toHaveBeenCalled();
      },
    );

    it.each(['coordenador', 'coordenador_financeiro', 'gestor_financeiro', 'analista_financeiro', 'administrativo'])(
      '%s cria, edita e exclui projetos',
      async (perfil) => {
        logadoComo(perfil);

        expect((await enviar('post', '/api/projetos', novo)).status).toBe(201);
        expect((await enviar('put', '/api/projetos/5', { nome: 'X' })).status).toBe(200);
        expect((await enviar('delete', '/api/projetos/5')).status).toBe(204);
      },
    );
  });

  describe('organização', () => {
    it.each(['educador', 'gestor_financeiro', 'administrativo'])(
      '%s consulta, mas não cria, edita nem exclui a organização',
      async (perfil) => {
        logadoComo(perfil);

        expect((await enviar('get', '/api/organizacoes')).status).toBe(200);
        expect((await enviar('post', '/api/organizacoes', { nome: 'Outra' })).status).toBe(403);
        expect((await enviar('put', '/api/organizacoes/3', { nome: 'X' })).status).toBe(403);
        expect((await enviar('delete', '/api/organizacoes/3')).status).toBe(403);
        expect(prisma.organizacao.create).not.toHaveBeenCalled();
        expect(prisma.organizacao.update).not.toHaveBeenCalled();
        expect(prisma.organizacao.delete).not.toHaveBeenCalled();
      },
    );

    it('coordenação edita a organização', async () => {
      logadoComo('coordenador');

      const res = await enviar('put', '/api/organizacoes/3', { nome: 'MDCA' });

      expect(res.status).toBe(200);
    });
  });
});
