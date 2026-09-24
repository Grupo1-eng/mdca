import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Autor e organização de um registro vêm do token, nunca do corpo: um usuário
// não pode lançar em nome de outro nem gravar dados em outra organização.
describe('Campos definidos pelo token (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: { create: jest.fn() },
    contaFinanceira: { create: jest.fn() },
    projeto: { create: jest.fn() },
    auditoria: { create: jest.fn() },
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
    token = app.get(JwtService).sign({ sub: 7 });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Maria',
      email: 'maria@mdca.org.br',
      perfil: 'administrativo',
      ativo: true,
    });
  });

  function post(rota: string, corpo: object) {
    return request(app.getHttpServer())
      .post(rota)
      .set('Authorization', `Bearer ${token}`)
      .send(corpo);
  }

  it('lançamento é gravado com o usuário do token', async () => {
    prisma.lancamento.create.mockResolvedValue({ id: 1 });

    const res = await post('/api/lancamentos', {
      contaId: 1,
      categoriaId: 2,
      valor: '10.00',
      tipo: 'saida',
      usuarioId: 999,
    });

    expect(res.status).toBe(201);
    expect(prisma.lancamento.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: 7, valor: '10.00' }),
    });
  });

  it('conta é criada na organização do token', async () => {
    prisma.contaFinanceira.create.mockResolvedValue({ id: 1 });

    const res = await post('/api/contas-financeiras', { nome: 'Caixa', organizacaoId: 999 });

    expect(res.status).toBe(201);
    expect(prisma.contaFinanceira.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizacaoId: 3 }),
    });
  });

  it('projeto é criado na organização do token', async () => {
    prisma.projeto.create.mockResolvedValue({ id: 1 });

    const res = await post('/api/projetos', { nome: 'Projeto', status: 'ativo', organizacaoId: 999 });

    expect(res.status).toBe(201);
    expect(prisma.projeto.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizacaoId: 3 }),
    });
  });

  it('auditoria é registrada com o usuário do token', async () => {
    prisma.auditoria.create.mockResolvedValue({ id: 1 });

    const res = await post('/api/auditorias', {
      recursoId: '1',
      recursoTipo: 'lancamento',
      acao: 'criar',
      usuarioId: 999,
    });

    expect(res.status).toBe(201);
    expect(prisma.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: 7 }),
    });
  });
});
