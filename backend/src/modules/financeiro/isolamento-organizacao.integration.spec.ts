import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Cada organização só enxerga e altera os próprios dados financeiros. O
// usuário logado é da organização 3; a organização 99 é a "vizinha".
// O Prisma falso abaixo responde como o banco: filtra pelo `where` recebido,
// então uma consulta sem filtro de organização devolve dados da vizinha.
describe('Isolamento por organização no financeiro (integração)', () => {
  let app: INestApplication;
  let token: string;

  const ORG_USUARIO = 3;
  const ORG_VIZINHA = 99;

  const contas = [
    { id: 1, organizacaoId: ORG_USUARIO, nome: 'Caixa da organização 3' },
    { id: 2, organizacaoId: ORG_VIZINHA, nome: 'Caixa da organização 99' },
  ];
  const projetos = [
    { id: 10, organizacaoId: ORG_USUARIO },
    { id: 20, organizacaoId: ORG_VIZINHA },
  ];
  const novembro = new Date('2026-11-03T00:00:00.000Z');
  const lancamentos = [
    { id: 100, contaId: 1, tipo: 'entrada', valor: '50.00', dataCompetencia: novembro, dataPagamento: null, criadoEm: novembro },
    { id: 200, contaId: 2, tipo: 'entrada', valor: '9999.00', dataCompetencia: novembro, dataPagamento: null, criadoEm: novembro },
  ];

  type Where = { id?: number; organizacaoId?: number; conta?: { organizacaoId?: number } };

  const organizacaoDaConta = (contaId: number) => contas.find((c) => c.id === contaId)?.organizacaoId;
  const lancamentoAtende = (l: (typeof lancamentos)[number], where: Where = {}) =>
    (where.id === undefined || l.id === where.id) &&
    (where.conta?.organizacaoId === undefined || organizacaoDaConta(l.contaId) === where.conta.organizacaoId);
  const atendeOrganizacao = (r: { id: number; organizacaoId: number }, where: Where = {}) =>
    (where.id === undefined || r.id === where.id) &&
    (where.organizacaoId === undefined || r.organizacaoId === where.organizacaoId);

  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contaFinanceira: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projeto: { findFirst: jest.fn() },
    auditoria: { create: jest.fn() },
    $transaction: jest.fn(),
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
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: ORG_USUARIO,
      nome: 'Maria',
      email: 'maria@mdca.org.br',
      perfil: 'gestor_financeiro',
      ativo: true,
    });

    prisma.lancamento.findMany.mockImplementation(async (args?: { where?: Where }) =>
      lancamentos.filter((l) => lancamentoAtende(l, args?.where)),
    );
    prisma.lancamento.findUnique.mockImplementation(
      async ({ where }: { where: Where }) => lancamentos.find((l) => l.id === where.id) ?? null,
    );
    prisma.lancamento.findFirst.mockImplementation(
      async ({ where }: { where: Where }) => lancamentos.find((l) => lancamentoAtende(l, where)) ?? null,
    );
    prisma.lancamento.create.mockImplementation(async ({ data }) => ({ id: 300, ...data }));
    prisma.lancamento.update.mockImplementation(async ({ where, data }) => ({ id: where.id, ...data }));

    prisma.contaFinanceira.findMany.mockImplementation(async (args?: { where?: Where }) =>
      contas.filter((c) => atendeOrganizacao(c, args?.where)),
    );
    prisma.contaFinanceira.findUnique.mockImplementation(
      async ({ where }: { where: Where }) => contas.find((c) => c.id === where.id) ?? null,
    );
    prisma.contaFinanceira.findFirst.mockImplementation(
      async ({ where }: { where: Where }) => contas.find((c) => atendeOrganizacao(c, where)) ?? null,
    );
    prisma.contaFinanceira.update.mockImplementation(async ({ where, data }) => ({ id: where.id, ...data }));

    prisma.projeto.findFirst.mockImplementation(
      async ({ where }: { where: Where }) => projetos.find((p) => atendeOrganizacao(p, where)) ?? null,
    );
  });

  const api = () => request(app.getHttpServer());
  const novoLancamento = { contaId: 1, categoriaId: 5, valor: '10.00', tipo: 'saida' };

  describe('lançamentos', () => {
    it('a listagem traz só os lançamentos da organização do usuário', async () => {
      const res = await api().get('/api/lancamentos').set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(200);
      expect(res.body.map((l: { id: number }) => l.id)).toEqual([100]);
    });

    it('o resumo semanal soma só os lançamentos da organização do usuário', async () => {
      const res = await api().get('/api/lancamentos/resumo-semanal?mes=2026-11').set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(200);
      expect(res.body.totais.entradas).toBe('50.00');
    });

    it('lançamento de outra organização não é encontrado', async () => {
      const res = await api().get('/api/lancamentos/200').set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(404);
    });

    it('lançamento de outra organização não pode ser alterado', async () => {
      const res = await api()
        .put('/api/lancamentos/200')
        .set({ Authorization: `Bearer ${token}` })
        .send({ valor: '1.00' });

      expect(res.status).toBe(404);
      expect(prisma.lancamento.update).not.toHaveBeenCalled();
    });

    it('lançamento de outra organização não pode ser excluído', async () => {
      const res = await api().delete('/api/lancamentos/200').set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(404);
      expect(prisma.lancamento.delete).not.toHaveBeenCalled();
    });

    it('lançamento é criado em conta da organização do usuário', async () => {
      const res = await api().post('/api/lancamentos').set({ Authorization: `Bearer ${token}` }).send(novoLancamento);

      expect(res.status).toBe(201);
      expect(prisma.lancamento.create).toHaveBeenCalled();
    });

    it('não cria lançamento em conta de outra organização', async () => {
      const res = await api()
        .post('/api/lancamentos')
        .set({ Authorization: `Bearer ${token}` })
        .send({ ...novoLancamento, contaId: 2 });

      expect(res.status).toBe(404);
      expect(prisma.lancamento.create).not.toHaveBeenCalled();
    });

    it('não cria lançamento ligado a projeto de outra organização', async () => {
      const res = await api()
        .post('/api/lancamentos')
        .set({ Authorization: `Bearer ${token}` })
        .send({ ...novoLancamento, projetoId: 20 });

      expect(res.status).toBe(404);
      expect(prisma.lancamento.create).not.toHaveBeenCalled();
    });

    it('não move lançamento para conta de outra organização', async () => {
      const res = await api()
        .put('/api/lancamentos/100')
        .set({ Authorization: `Bearer ${token}` })
        .send({ contaId: 2 });

      expect(res.status).toBe(404);
      expect(prisma.lancamento.update).not.toHaveBeenCalled();
    });
  });

  describe('contas financeiras', () => {
    it('a listagem traz só as contas da organização do usuário', async () => {
      const res = await api().get('/api/contas-financeiras').set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(200);
      expect(res.body.map((c: { id: number }) => c.id)).toEqual([1]);
    });

    it('conta de outra organização não é encontrada', async () => {
      const res = await api().get('/api/contas-financeiras/2').set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(404);
    });

    it('conta de outra organização não pode ser alterada', async () => {
      const res = await api()
        .put('/api/contas-financeiras/2')
        .set({ Authorization: `Bearer ${token}` })
        .send({ nome: 'Invadida' });

      expect(res.status).toBe(404);
      expect(prisma.contaFinanceira.update).not.toHaveBeenCalled();
    });

    it('conta de outra organização não pode ser excluída', async () => {
      const res = await api().delete('/api/contas-financeiras/2').set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(404);
      expect(prisma.contaFinanceira.delete).not.toHaveBeenCalled();
    });
  });
});
