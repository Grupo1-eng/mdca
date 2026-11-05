import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// US02 / RF25 / RF64: o saldo atual da conta acompanha os lançamentos
// realizados, na mesma transação em que o lançamento é gravado.
describe('Saldo das contas acompanha os lançamentos (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contaFinanceira: { findFirst: jest.fn(), update: jest.fn() },
    projeto: { findFirst: jest.fn() },
    auditoria: { create: jest.fn() },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const lancamento = {
    id: 42,
    contaId: 1,
    categoriaId: 2,
    projetoId: null,
    usuarioId: 7,
    contatoId: null,
    valor: new Prisma.Decimal('100.00'),
    tipo: 'saida',
    descricao: 'Conta de luz',
    dataPagamento: null,
    dataCompetencia: null,
    situacao: 'pendente',
    criadoEm: new Date('2026-10-01T12:00:00Z'),
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
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Maria',
      email: 'maria@mdca.org.br',
      perfil: 'analista_financeiro',
      ativo: true,
    });
    prisma.contaFinanceira.findFirst.mockResolvedValue({
      id: 1,
      organizacaoId: 3,
    });
  });

  function enviar(metodo: 'post' | 'put' | 'delete', rota: string, corpo?: object) {
    const req = request(app.getHttpServer())[metodo](rota).set('Authorization', `Bearer ${token}`);
    return corpo ? req.send(corpo) : req;
  }

  /** Ajustes de saldo feitos, como [contaId, valor com sinal]. */
  function ajustes(): [number, string][] {
    return prisma.contaFinanceira.update.mock.calls.map(([args]) => [
      args.where.id,
      args.data.saldoAtual.increment.toString(),
    ]);
  }

  it('criar saída paga subtrai o valor do saldo da conta', async () => {
    prisma.lancamento.create.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
    });

    const res = await enviar('post', '/api/lancamentos', {
      contaId: 1,
      categoriaId: 2,
      valor: '100.00',
      tipo: 'saida',
      situacao: 'pago',
    });

    expect(res.status).toBe(201);
    expect(ajustes()).toEqual([[1, '-100']]);
  });

  it('criar lançamento pendente não mexe no saldo', async () => {
    prisma.lancamento.create.mockResolvedValue(lancamento);

    await enviar('post', '/api/lancamentos', {
      contaId: 1,
      categoriaId: 2,
      valor: '100.00',
      tipo: 'saida',
    });

    expect(prisma.contaFinanceira.update).not.toHaveBeenCalled();
  });

  it('marcar como pago aplica o valor no saldo', async () => {
    prisma.lancamento.findFirst.mockResolvedValue(lancamento);
    prisma.lancamento.update.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
    });

    await enviar('put', '/api/lancamentos/42', { situacao: 'pago' });

    expect(ajustes()).toEqual([[1, '-100']]);
  });

  it('mudar o valor de um lançamento pago ajusta só a diferença', async () => {
    prisma.lancamento.findFirst.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
    });
    prisma.lancamento.update.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
      valor: new Prisma.Decimal('130.00'),
    });

    await enviar('put', '/api/lancamentos/42', { valor: '130.00' });

    expect(ajustes()).toEqual([[1, '-30']]);
  });

  it('trocar a conta de um lançamento pago devolve o valor à antiga e aplica na nova', async () => {
    prisma.lancamento.findFirst.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
    });
    prisma.lancamento.update.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
      contaId: 5,
    });

    await enviar('put', '/api/lancamentos/42', { contaId: 5 });

    expect(ajustes()).toEqual([
      [1, '100'],
      [5, '-100'],
    ]);
  });

  it('editar só a descrição não mexe no saldo', async () => {
    prisma.lancamento.findFirst.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
    });
    prisma.lancamento.update.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
      descricao: 'Luz',
    });

    await enviar('put', '/api/lancamentos/42', { descricao: 'Luz' });

    expect(prisma.contaFinanceira.update).not.toHaveBeenCalled();
  });

  it('excluir entrada recebida tira o valor do saldo', async () => {
    prisma.lancamento.findFirst.mockResolvedValue({
      ...lancamento,
      tipo: 'entrada',
      situacao: 'recebido',
    });

    const res = await enviar('delete', '/api/lancamentos/42');

    expect(res.status).toBeLessThan(300);
    expect(ajustes()).toEqual([[1, '-100']]);
  });

  it('se o ajuste do saldo falhar, o lançamento não é gravado', async () => {
    prisma.lancamento.create.mockResolvedValue({
      ...lancamento,
      situacao: 'pago',
    });
    prisma.contaFinanceira.update.mockRejectedValue(new Error('falha no banco'));

    const res = await enviar('post', '/api/lancamentos', {
      contaId: 1,
      categoriaId: 2,
      valor: '100.00',
      tipo: 'saida',
      situacao: 'pago',
    });

    expect(res.status).toBe(500);
    expect(prisma.auditoria.create).not.toHaveBeenCalled();
  });
});
