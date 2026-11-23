import { dataDoLancamento } from './resumo-semanal';

export type ValorCelula = string | number | null;

export interface LancamentoDoExtrato {
  id: number;
  tipo: string;
  valor: { toString(): string } | string | number;
  descricao: string | null;
  situacao: string;
  dataCompetencia: Date | null;
  dataPagamento: Date | null;
  criadoEm: Date;
  conta: { nome: string };
  categoria: { nome: string };
  projeto: { nome: string } | null;
}

export interface FiltrosDoExtrato {
  periodo: string;
  projeto: string;
  categoria: string;
  tipo: string;
  busca?: string;
}

export interface DadosDoExtrato {
  titulo: string;
  filtros: string[];
  emissao: string;
  colunas: string[];
  linhas: ValorCelula[][];
  totais: ValorCelula[];
}

export const COLUNAS_DO_EXTRATO = [
  'Data',
  'Descrição',
  'Projeto',
  'Conta',
  'Categoria',
  'Situação',
  'Entrada',
  'Saída',
];

const ROTULO_SITUACAO: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  recebido: 'Recebido',
};

export function dataDeTexto(texto: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return null;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const existe =
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
  return existe ? data : null;
}

export function formatarData(data: Date): string {
  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getUTCFullYear()}`;
}

export function rotuloDoPeriodo(de?: Date, ate?: Date): string {
  if (de && ate) return `${formatarData(de)} a ${formatarData(ate)}`;
  if (de) return `A partir de ${formatarData(de)}`;
  if (ate) return `Até ${formatarData(ate)}`;
  return 'Todo o período';
}

function partesEmSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return {
    ano: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora: valor('hour'),
    minuto: valor('minute'),
  };
}

export function textoDaEmissao(agora: Date, usuario: string | null): string {
  const { ano, mes, dia, hora, minuto } = partesEmSaoPaulo(agora);
  const autor = usuario ? ` por ${usuario}` : '';
  return `Gerado em ${dia}/${mes}/${ano} ${hora}:${minuto}${autor}`;
}

export function nomeDoArquivo(agora: Date): string {
  const { ano, mes, dia } = partesEmSaoPaulo(agora);
  return `extrato-financeiro-${ano}-${mes}-${dia}.xlsx`;
}

function emCentavos(valor: LancamentoDoExtrato['valor']): number {
  return Math.round(Number(valor.toString()) * 100);
}

export function montarDadosDoExtrato(
  lancamentos: LancamentoDoExtrato[],
  filtros: FiltrosDoExtrato,
  usuario: string | null,
  agora: Date,
): DadosDoExtrato {
  const ordenados = [...lancamentos].sort(
    (a, b) => dataDoLancamento(a).getTime() - dataDoLancamento(b).getTime() || a.id - b.id,
  );

  let entradas = 0;
  let saidas = 0;
  const linhas = ordenados.map((l): ValorCelula[] => {
    const centavos = emCentavos(l.valor);
    const ehEntrada = l.tipo === 'entrada';
    const ehSaida = l.tipo === 'saida';
    if (ehEntrada) entradas += centavos;
    if (ehSaida) saidas += centavos;
    return [
      formatarData(dataDoLancamento(l)),
      l.descricao ?? '',
      l.projeto?.nome ?? '',
      l.conta.nome,
      l.categoria.nome,
      ROTULO_SITUACAO[l.situacao] ?? l.situacao,
      ehEntrada ? centavos / 100 : null,
      ehSaida ? centavos / 100 : null,
    ];
  });

  const quantidade = ordenados.length === 1 ? '1 lançamento' : `${ordenados.length} lançamentos`;

  return {
    titulo: 'Extrato Financeiro',
    filtros: [
      `Período: ${filtros.periodo}`,
      `Projeto: ${filtros.projeto}`,
      `Categoria: ${filtros.categoria}`,
      `Tipo: ${filtros.tipo}`,
      ...(filtros.busca ? [`Busca: ${filtros.busca}`] : []),
    ],
    emissao: textoDaEmissao(agora, usuario),
    colunas: COLUNAS_DO_EXTRATO,
    linhas,
    totais: [quantidade, null, null, null, null, 'Totais', entradas / 100, saidas / 100],
  };
}
