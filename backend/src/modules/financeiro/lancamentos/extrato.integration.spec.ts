import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Workbook } from 'exceljs';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

describe('GET /api/lancamentos/extrato/exportar (integração)', () => {
  let app: INestApplication;
  let token: string;
  const prisma = {
    usuario: { findUnique: jest.fn() },
    lancamento: { findMany: jest.fn() },
    projeto: { findFirst: jest.fn() },
    categoriaFinanceira: { findUnique: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const lancamentos = [
    {
      id: 1,
      tipo: 'entrada',
      valor: '1000.00',
      descricao: 'Doação',
      situacao: 'recebido',
      dataCompetencia: new Date('2026-11-10T00:00:00.000Z'),
      dataPagamento: null,
      criadoEm: new Date('2026-10-01T00:00:00.000Z'),
      conta: { nome: 'Caixa' },
      categoria: { nome: 'Doações' },
      projeto: null,
    },
    {
      id: 2,
      tipo: 'saida',
      valor: '250.50',
      descricao: 'Material de oficina',
      situacao: 'pago',
      dataCompetencia: new Date('2026-11-03T00:00:00.000Z'),
      dataPagamento: null,
      criadoEm: new Date('2026-10-01T00:00:00.000Z'),
      conta: { nome: 'Banco' },
      categoria: { nome: 'Materiais' },
      projeto: { nome: 'Oficina' },
    },
  ];

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
    logadoComo('analista_financeiro');
    prisma.lancamento.findMany.mockResolvedValue(lancamentos);
  });

  function logadoComo(perfil: string) {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      organizacaoId: 3,
      nome: 'Maria',
      email: 'maria@mdca.org.br',
      perfil,
      ativo: true,
    });
  }

  const chamar = (query: string) =>
    request(app.getHttpServer())
      .get(`/api/lancamentos/extrato/exportar${query}`)
      .set('Authorization', `Bearer ${token}`);

  const baixar = (query: string) =>
    chamar(query)
      .buffer(true)
      .parse((res, callback) => {
        const partes: Buffer[] = [];
        res.on('data', (parte: Buffer) => partes.push(parte));
        res.on('end', () => callback(null, Buffer.concat(partes)));
      });

  async function lerPlanilha(corpo: Buffer) {
    const workbook = new Workbook();
    await workbook.xlsx.load(corpo as any);
    const linhas: any[][] = [];
    workbook.worksheets[0].eachRow({ includeEmpty: true }, (linha) => {
      linhas.push((linha.values as any[]).slice(1));
    });
    return linhas;
  }

  it('devolve um arquivo .xlsx para download', async () => {
    const res = await baixar('');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="extrato-financeiro-\d{4}-\d{2}-\d{2}\.xlsx"$/,
    );
    expect(res.body.subarray(0, 2).toString()).toBe('PK');
  });

  it('a planilha traz os lançamentos do banco, ordenados por data, com os totais', async () => {
    const res = await baixar('');
    const linhas = await lerPlanilha(res.body);
    const cabecalho = linhas.findIndex((l) => l[0] === 'Data');

    expect(linhas[0][0]).toBe('Extrato Financeiro');
    expect(linhas.map((l) => l[0])).toEqual(
      expect.arrayContaining(['Período: Todo o período', 'Projeto: Todos', 'Categoria: Todas', 'Tipo: Todos']),
    );
    expect(linhas.some((l) => /^Gerado em \d{2}\/\d{2}\/\d{4} \d{2}:\d{2} por Maria$/.test(l[0]))).toBe(true);
    expect(linhas[cabecalho]).toEqual([
      'Data', 'Descrição', 'Projeto', 'Conta', 'Categoria', 'Situação', 'Entrada', 'Saída',
    ]);
    expect(linhas[cabecalho + 1][0]).toBe('03/11/2026');
    expect(linhas[cabecalho + 1][1]).toBe('Material de oficina');
    expect(linhas[cabecalho + 1][2]).toBe('Oficina');
    expect(linhas[cabecalho + 1][7]).toBe(250.5);
    expect(linhas[cabecalho + 2][0]).toBe('10/11/2026');
    expect(linhas[cabecalho + 2][6]).toBe(1000);
    expect(linhas[cabecalho + 3][0]).toBe('2 lançamentos');
    expect(linhas[cabecalho + 3][5]).toBe('Totais');
    expect(linhas[cabecalho + 3][6]).toBe(1000);
    expect(linhas[cabecalho + 3][7]).toBe(250.5);
  });

  it('busca só os lançamentos da organização do usuário', async () => {
    await baixar('');

    const { where } = prisma.lancamento.findMany.mock.calls[0][0];
    expect(where.conta).toEqual({ organizacaoId: 3 });
    expect(where.AND).toBeUndefined();
  });

  it('aplica os filtros antes de gerar o arquivo', async () => {
    prisma.projeto.findFirst.mockResolvedValue({ nome: 'Oficina' });
    prisma.categoriaFinanceira.findUnique.mockResolvedValue({ nome: 'Materiais' });

    const res = await baixar(
      '?de=2026-11-01&ate=2026-11-30&projetoId=12&categoriaId=5&tipo=saida&busca=%20oficina%20',
    );

    expect(res.status).toBe(200);
    expect(prisma.projeto.findFirst).toHaveBeenCalledWith({
      where: { id: 12, organizacaoId: 3 },
      select: { nome: true },
    });
    const { where } = prisma.lancamento.findMany.mock.calls[0][0];
    const periodo = {
      gte: new Date('2026-11-01T00:00:00.000Z'),
      lt: new Date('2026-12-01T00:00:00.000Z'),
    };
    expect(where.conta).toEqual({ organizacaoId: 3 });
    expect(where.projetoId).toBe(12);
    expect(where.tipo).toBe('saida');
    expect(where.categoria).toEqual({ OR: [{ id: 5 }, { categoriaPaiId: 5 }] });
    expect(where.AND[0].OR[0]).toEqual({ dataCompetencia: periodo });
    expect(where.AND[1].OR[0]).toEqual({ descricao: { contains: 'oficina', mode: 'insensitive' } });

    const textos = (await lerPlanilha(res.body)).map((l) => l[0]);
    expect(textos).toEqual(
      expect.arrayContaining([
        'Período: 01/11/2026 a 30/11/2026',
        'Projeto: Oficina',
        'Categoria: Materiais',
        'Tipo: Saídas',
        'Busca: oficina',
      ]),
    );
  });

  it('projetoId=nenhum pede só os lançamentos sem projeto', async () => {
    const res = await baixar('?projetoId=nenhum');

    const { where } = prisma.lancamento.findMany.mock.calls[0][0];
    expect(where.projetoId).toBeNull();
    expect(prisma.projeto.findFirst).not.toHaveBeenCalled();
    expect((await lerPlanilha(res.body)).map((l) => l[0])).toContain('Projeto: Sem projeto');
  });

  it('gera a planilha mesmo sem lançamentos no filtro', async () => {
    prisma.lancamento.findMany.mockResolvedValue([]);

    const res = await baixar('?tipo=entrada');
    const linhas = await lerPlanilha(res.body);

    expect(res.status).toBe(200);
    expect(linhas[linhas.length - 1][0]).toBe('0 lançamentos');
  });

  it.each([
    '?de=2026-02-31',
    '?de=01/11/2026',
    '?ate=amanha',
    '?de=2026-11-30&ate=2026-11-01',
    '?tipo=outro',
    '?projetoId=abc',
    '?projetoId=0',
    '?categoriaId=0',
    '?categoriaId=abc',
  ])('recusa filtro inválido (%s) com 400', async (query) => {
    const res = await chamar(query);

    expect(res.status).toBe(400);
    expect(prisma.lancamento.findMany).not.toHaveBeenCalled();
  });

  it('projeto de outra organização ou inexistente responde 404', async () => {
    prisma.projeto.findFirst.mockResolvedValue(null);

    const res = await chamar('?projetoId=99');

    expect(res.status).toBe(404);
    expect(prisma.lancamento.findMany).not.toHaveBeenCalled();
  });

  it('categoria inexistente responde 404', async () => {
    prisma.categoriaFinanceira.findUnique.mockResolvedValue(null);

    const res = await chamar('?categoriaId=99');

    expect(res.status).toBe(404);
    expect(prisma.lancamento.findMany).not.toHaveBeenCalled();
  });

  it('perfil sem acesso ao financeiro recebe 403', async () => {
    logadoComo('educador');

    const res = await chamar('');

    expect(res.status).toBe(403);
    expect(prisma.lancamento.findMany).not.toHaveBeenCalled();
  });

  it('sem token recebe 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/lancamentos/extrato/exportar');

    expect(res.status).toBe(401);
  });
});
