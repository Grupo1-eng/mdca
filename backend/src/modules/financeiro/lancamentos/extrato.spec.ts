import {
  LancamentoDoExtrato,
  dataDeTexto,
  montarDadosDoExtrato,
  nomeDoArquivo,
  rotuloDoPeriodo,
  textoDaEmissao,
} from './extrato';

function lanc(extra: Partial<LancamentoDoExtrato> = {}): LancamentoDoExtrato {
  return {
    id: 1,
    tipo: 'entrada',
    valor: '100.00',
    descricao: 'Doação',
    situacao: 'recebido',
    dataCompetencia: new Date('2026-11-10T00:00:00.000Z'),
    dataPagamento: null,
    criadoEm: new Date('2026-10-01T00:00:00.000Z'),
    conta: { nome: 'Caixa' },
    categoria: { nome: 'Doações' },
    projeto: null,
    ...extra,
  };
}

const filtros = {
  periodo: 'Todo o período',
  projeto: 'Todos',
  categoria: 'Todas',
  tipo: 'Todos',
};
const agora = new Date('2026-11-19T17:30:00.000Z');

describe('dataDeTexto', () => {
  it('lê datas válidas em UTC', () => {
    expect(dataDeTexto('2026-11-30')?.toISOString()).toBe('2026-11-30T00:00:00.000Z');
    expect(dataDeTexto('2028-02-29')?.toISOString()).toBe('2028-02-29T00:00:00.000Z');
  });

  it.each(['2026-02-31', '2027-02-29', '2026-13-01', '2026-00-10', '01/11/2026', '2026-1-1', ''])(
    'recusa %p',
    (texto) => {
      expect(dataDeTexto(texto)).toBeNull();
    },
  );
});

describe('rotuloDoPeriodo', () => {
  it('descreve o período conforme os limites informados', () => {
    const de = new Date('2026-11-01T00:00:00.000Z');
    const ate = new Date('2026-11-30T00:00:00.000Z');

    expect(rotuloDoPeriodo(de, ate)).toBe('01/11/2026 a 30/11/2026');
    expect(rotuloDoPeriodo(de, undefined)).toBe('A partir de 01/11/2026');
    expect(rotuloDoPeriodo(undefined, ate)).toBe('Até 30/11/2026');
    expect(rotuloDoPeriodo(undefined, undefined)).toBe('Todo o período');
  });
});

describe('emissão e nome do arquivo', () => {
  it('usa o horário de Brasília', () => {
    expect(textoDaEmissao(agora, 'Maria')).toBe('Gerado em 19/11/2026 14:30 por Maria');
    expect(textoDaEmissao(new Date('2026-11-20T02:30:00.000Z'), null)).toBe(
      'Gerado em 19/11/2026 23:30',
    );
  });

  it('nomeia o arquivo com a data da emissão', () => {
    expect(nomeDoArquivo(agora)).toBe('extrato-financeiro-2026-11-19.xlsx');
    expect(nomeDoArquivo(new Date('2026-11-20T02:30:00.000Z'))).toBe(
      'extrato-financeiro-2026-11-19.xlsx',
    );
  });
});

describe('montarDadosDoExtrato', () => {
  it('traz título, filtros, emissão e colunas do extrato', () => {
    const dados = montarDadosDoExtrato([], filtros, 'Maria', agora);

    expect(dados.titulo).toBe('Extrato Financeiro');
    expect(dados.filtros).toEqual([
      'Período: Todo o período',
      'Projeto: Todos',
      'Categoria: Todas',
      'Tipo: Todos',
    ]);
    expect(dados.emissao).toBe('Gerado em 19/11/2026 14:30 por Maria');
    expect(dados.colunas).toEqual([
      'Data',
      'Descrição',
      'Projeto',
      'Conta',
      'Categoria',
      'Situação',
      'Entrada',
      'Saída',
    ]);
  });

  it('inclui a busca entre os filtros só quando ela existe', () => {
    const dados = montarDadosDoExtrato([], { ...filtros, busca: 'oficina' }, null, agora);

    expect(dados.filtros[dados.filtros.length - 1]).toBe('Busca: oficina');
  });

  it('põe cada valor na coluna do seu tipo e ordena por data', () => {
    const dados = montarDadosDoExtrato(
      [
        lanc({ id: 1 }),
        lanc({
          id: 2,
          tipo: 'saida',
          valor: '250.50',
          descricao: 'Material',
          situacao: 'pago',
          dataCompetencia: new Date('2026-11-03T00:00:00.000Z'),
          conta: { nome: 'Banco' },
          categoria: { nome: 'Materiais' },
          projeto: { nome: 'Oficina' },
        }),
      ],
      filtros,
      'Maria',
      agora,
    );

    expect(dados.linhas).toEqual([
      ['03/11/2026', 'Material', 'Oficina', 'Banco', 'Materiais', 'Pago', null, 250.5],
      ['10/11/2026', 'Doação', '', 'Caixa', 'Doações', 'Recebido', 100, null],
    ]);
  });

  it('soma os totais de entradas e saídas', () => {
    const dados = montarDadosDoExtrato(
      [
        lanc({ id: 1, valor: '1000.00' }),
        lanc({ id: 2, tipo: 'saida', valor: '250.50', situacao: 'pago' }),
        lanc({ id: 3, tipo: 'saida', valor: '800.00', situacao: 'pendente' }),
      ],
      filtros,
      null,
      agora,
    );

    expect(dados.totais).toEqual(['3 lançamentos', null, null, null, null, 'Totais', 1000, 1050.5]);
  });

  it('soma em centavos, sem erro de ponto flutuante', () => {
    const dados = montarDadosDoExtrato(
      [lanc({ id: 1, valor: '0.10' }), lanc({ id: 2, valor: '0.20' })],
      filtros,
      null,
      agora,
    );

    expect(dados.totais[6]).toBe(0.3);
  });

  it('usa a data de competência, senão a de pagamento, senão a de criação', () => {
    const dados = montarDadosDoExtrato(
      [
        lanc({ id: 1, dataPagamento: new Date('2026-11-25T00:00:00.000Z') }),
        lanc({ id: 2, dataCompetencia: null, dataPagamento: new Date('2026-11-09T00:00:00.000Z') }),
        lanc({ id: 3, dataCompetencia: null, dataPagamento: null }),
      ],
      filtros,
      null,
      agora,
    );

    expect(dados.linhas.map((l) => l[0])).toEqual(['01/10/2026', '09/11/2026', '10/11/2026']);
  });

  it('escreve "1 lançamento" no singular e mantém a linha de totais sem lançamentos', () => {
    expect(montarDadosDoExtrato([lanc()], filtros, null, agora).totais[0]).toBe('1 lançamento');
    expect(montarDadosDoExtrato([], filtros, null, agora).totais).toEqual([
      '0 lançamentos',
      null,
      null,
      null,
      null,
      'Totais',
      0,
      0,
    ]);
  });
});
