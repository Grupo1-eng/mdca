import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Revisão de 2026-11-05: situação compatível com o tipo, conta inativa não
// recebe lançamento novo (RNF10/RF16) e valor maior que zero (RF33).
describe('Regras do lançamento (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    contaFinanceira: { findFirst: jest.fn(), update: jest.fn() },
    projeto: { findFirst: jest.fn() },
    auditoria: { create: jest.fn() },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const lancamento = {
    id: 42, contaId: 1, categoriaId: 2, projetoId: null, usuarioId: 7, contatoId: null,
    valor: new Prisma.Decimal('100.00'), tipo: 'entrada', descricao: 'Doação',
    dataPagamento: null, dataCompetencia: null, situacao: 'pendente',
    criadoEm: new Date('2026-10-01T12:00:00Z'),
  };
  const contaAtiva = { id: 1, organizacaoId: 3, ativa: true };
  const contaInativa = { id: 9, organizacaoId: 3, ativa: false };
  const novo = { contaId: 1, categoriaId: 2, valor: '100.00', tipo: 'entrada' };

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
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7, organizacaoId: 3, nome: 'Maria', email: 'maria@mdca.org.br', perfil: 'analista_financeiro', ativo: true,
    });
    prisma.contaFinanceira.findFirst.mockImplementation(({ where }) =>
      Promise.resolve([contaAtiva, contaInativa].find((c) => c.id === where.id) ?? null),
    );
    prisma.lancamento.findFirst.mockResolvedValue(lancamento);
    prisma.lancamento.create.mockImplementation(({ data }) => Promise.resolve({ ...lancamento, ...data }));
    prisma.lancamento.update.mockImplementation(({ data }) => Promise.resolve({ ...lancamento, ...data }));
  });

  function enviar(metodo: 'post' | 'put', rota: string, corpo: object) {
    return request(app.getHttpServer())[metodo](rota).set('Authorization', `Bearer ${token}`).send(corpo);
  }

  describe('situação compatível com o tipo', () => {
    it.each([
      ['entrada', 'pago'],
      ['saida', 'recebido'],
    ])('recusa %s com situação %s', async (tipo, situacao) => {
      const res = await enviar('post', '/api/lancamentos', { ...novo, tipo, situacao });

      expect(res.status).toBe(400);
      expect(prisma.lancamento.create).not.toHaveBeenCalled();
    });

    it.each([
      ['entrada', 'recebido'],
      ['saida', 'pago'],
      ['saida', undefined],
    ])('aceita %s com situação %s', async (tipo, situacao) => {
      const res = await enviar('post', '/api/lancamentos', { ...novo, tipo, situacao });

      expect(res.status).toBe(201);
    });

    it('na edição, compara a situação nova com o tipo que já estava gravado', async () => {
      const res = await enviar('put', '/api/lancamentos/42', { situacao: 'pago' });

      expect(res.status).toBe(400);
      expect(prisma.lancamento.update).not.toHaveBeenCalled();
    });

    it('na edição, trocar só o tipo também é conferido contra a situação gravada', async () => {
      prisma.lancamento.findFirst.mockResolvedValue({ ...lancamento, situacao: 'recebido' });

      const res = await enviar('put', '/api/lancamentos/42', { tipo: 'saida' });

      expect(res.status).toBe(400);
      expect(prisma.lancamento.update).not.toHaveBeenCalled();
    });
  });

  describe('conta inativa', () => {
    it('não aceita lançamento novo', async () => {
      const res = await enviar('post', '/api/lancamentos', { ...novo, contaId: 9 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('inativa');
      expect(prisma.lancamento.create).not.toHaveBeenCalled();
    });

    it('não aceita mover um lançamento para ela', async () => {
      const res = await enviar('put', '/api/lancamentos/42', { contaId: 9 });

      expect(res.status).toBe(400);
      expect(prisma.lancamento.update).not.toHaveBeenCalled();
    });

    it('mantém os lançamentos que já tinha: dá para editá-los sem trocar de conta', async () => {
      prisma.lancamento.findFirst.mockResolvedValue({ ...lancamento, contaId: 9 });

      const res = await enviar('put', '/api/lancamentos/42', { descricao: 'Doação de outubro' });

      expect(res.status).toBe(200);
    });
  });

  describe('valor', () => {
    it.each(['0', '0.00', '0.0'])('recusa valor zero (%s)', async (valor) => {
      const res = await enviar('post', '/api/lancamentos', { ...novo, valor });

      expect(res.status).toBe(400);
      expect(prisma.lancamento.create).not.toHaveBeenCalled();
    });

    it('aceita um centavo', async () => {
      const res = await enviar('post', '/api/lancamentos', { ...novo, valor: '0.01' });

      expect(res.status).toBe(201);
    });

    it('recusa zerar o valor na edição', async () => {
      const res = await enviar('put', '/api/lancamentos/42', { valor: '0.00' });

      expect(res.status).toBe(400);
    });
  });
});
