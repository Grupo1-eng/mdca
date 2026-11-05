import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Cada alteração no financeiro grava um registro de auditoria na mesma
// transação, com autor e organização do token e só os campos alterados.
describe('Auditoria das operações do financeiro (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    contaFinanceira: { findFirst: jest.fn(), update: jest.fn() },
    contato: { findUnique: jest.fn(), update: jest.fn() },
    orcamento: { findUnique: jest.fn(), delete: jest.fn() },
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

  const conta = {
    id: 3,
    organizacaoId: 3,
    nome: 'Conta movimento',
    tipo: 'corrente',
    banco: 'Banco X',
    agencia: '1234',
    numero: '0012345-6',
    saldoInicial: new Prisma.Decimal('0'),
    saldoAtual: new Prisma.Decimal('500'),
    ativa: true,
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
  });

  function enviar(metodo: 'post' | 'put' | 'delete', rota: string, corpo?: object) {
    const req = request(app.getHttpServer())[metodo](rota).set('Authorization', `Bearer ${token}`);
    return corpo ? req.send(corpo) : req;
  }

  function auditado() {
    expect(prisma.auditoria.create).toHaveBeenCalledTimes(1);
    return prisma.auditoria.create.mock.calls[0][0].data;
  }

  it('criação de lançamento registra autor, organização, origem e valores criados', async () => {
    prisma.contaFinanceira.findFirst.mockResolvedValue({ id: 1, organizacaoId: 3, ativa: true });
    prisma.lancamento.create.mockResolvedValue(lancamento);

    const res = await enviar('post', '/api/lancamentos', {
      contaId: 1,
      categoriaId: 2,
      valor: '100.00',
      tipo: 'saida',
      descricao: 'Conta de luz',
    });

    expect(res.status).toBe(201);
    const data = auditado();
    expect(data).toEqual(
      expect.objectContaining({
        modulo: 'financeiro',
        acao: 'criar',
        recursoTipo: 'lancamento',
        recursoId: '42',
        resumo: 'Lançamento #42 criado',
        usuarioId: 7,
        perfil: 'analista_financeiro',
        organizacaoId: 3,
        requestId: res.headers['x-request-id'],
      }),
    );
    expect(data.alteracoes).toEqual(
      expect.objectContaining({ valor: { para: '100' }, situacao: { para: 'pendente' } }),
    );
  });

  it('mudança só de situação vira "mudar_situacao" com de e para', async () => {
    prisma.lancamento.findFirst.mockResolvedValue(lancamento);
    prisma.lancamento.update.mockResolvedValue({ ...lancamento, situacao: 'pago' });

    await enviar('put', '/api/lancamentos/42', { situacao: 'pago' });

    expect(auditado()).toEqual(
      expect.objectContaining({
        acao: 'mudar_situacao',
        resumo: 'Lançamento #42: situação pendente → pago',
        alteracoes: { situacao: { de: 'pendente', para: 'pago' } },
      }),
    );
  });

  it('edição comum guarda só os campos alterados', async () => {
    prisma.lancamento.findFirst.mockResolvedValue(lancamento);
    prisma.lancamento.update.mockResolvedValue({
      ...lancamento,
      valor: new Prisma.Decimal('150.00'),
      descricao: 'Luz de outubro',
    });

    await enviar('put', '/api/lancamentos/42', { valor: '150.00', descricao: 'Luz de outubro' });

    expect(auditado()).toEqual(
      expect.objectContaining({
        acao: 'atualizar',
        resumo: 'Lançamento #42 atualizado: valor, descricao',
        alteracoes: {
          valor: { de: '100', para: '150' },
          descricao: { de: 'Conta de luz', para: 'Luz de outubro' },
        },
      }),
    );
  });

  it('inativar conta vira "inativar"', async () => {
    prisma.contaFinanceira.findFirst.mockResolvedValue(conta);
    prisma.contaFinanceira.update.mockResolvedValue({ ...conta, ativa: false });

    await enviar('put', '/api/contas-financeiras/3', { ativa: false });

    expect(auditado()).toEqual(
      expect.objectContaining({ acao: 'inativar', resumo: 'Conta financeira #3 (Conta movimento) inativada' }),
    );
  });

  it('alterar saldo atual vira "ajustar_saldo" e dados bancários ficam mascarados', async () => {
    prisma.contaFinanceira.findFirst.mockResolvedValue(conta);
    prisma.contaFinanceira.update.mockResolvedValue({
      ...conta,
      saldoAtual: new Prisma.Decimal('450'),
      agencia: '4321',
    });

    await enviar('put', '/api/contas-financeiras/3', { saldoAtual: '450', agencia: '4321' });

    const data = auditado();
    expect(data.acao).toBe('ajustar_saldo');
    expect(data.alteracoes).toEqual({
      saldoAtual: { de: '500', para: '450' },
      agencia: { de: '••34', para: '••21' },
    });
  });

  it('CPF/CNPJ não aparece no log: alterar só ele não gera registro', async () => {
    const contato = { id: 5, nome: 'Fornecedor', tipo: null, papel: null, cpfCnpj: '12345678900', telefone: null, observacoes: null };
    prisma.contato.findUnique.mockResolvedValue(contato);
    prisma.contato.update.mockResolvedValue({ ...contato, cpfCnpj: '98765432100' });

    const res = await enviar('put', '/api/contatos/5', { cpfCnpj: '98765432100' });

    expect(res.status).toBe(200);
    expect(prisma.auditoria.create).not.toHaveBeenCalled();
  });

  it('exclusão guarda o estado do registro excluído', async () => {
    const orcamento = { id: 8, projetoId: 1, categoriaId: 2, periodoReferencia: '2026-10', valorPrevisto: new Prisma.Decimal('3000') };
    prisma.orcamento.findUnique.mockResolvedValue(orcamento);

    const res = await enviar('delete', '/api/orcamentos/8');

    expect(res.status).toBe(204);
    expect(auditado()).toEqual(
      expect.objectContaining({
        acao: 'excluir',
        recursoId: '8',
        resumo: 'Orçamento #8 excluído',
        alteracoes: expect.objectContaining({ valorPrevisto: { de: '3000' }, periodoReferencia: { de: '2026-10' } }),
      }),
    );
  });

  it('se a auditoria falhar, a operação falha junto', async () => {
    prisma.contaFinanceira.findFirst.mockResolvedValue({ id: 1, organizacaoId: 3, ativa: true });
    prisma.lancamento.create.mockResolvedValue(lancamento);
    prisma.auditoria.create.mockRejectedValue(new Error('banco fora'));

    const res = await enviar('post', '/api/lancamentos', {
      contaId: 1,
      categoriaId: 2,
      valor: '100.00',
      tipo: 'saida',
    });

    expect(res.status).toBe(500);
  });

  it('registro inexistente: 404 e nada é auditado', async () => {
    prisma.lancamento.findFirst.mockResolvedValue(null);

    const res = await enviar('delete', '/api/lancamentos/99');

    expect(res.status).toBe(404);
    expect(prisma.lancamento.delete).not.toHaveBeenCalled();
    expect(prisma.auditoria.create).not.toHaveBeenCalled();
  });
});
