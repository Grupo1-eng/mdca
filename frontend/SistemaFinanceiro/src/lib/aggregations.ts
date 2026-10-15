// Funções puras que derivam os números do Dashboard, do fluxo de caixa e dos
// relatórios a partir das listas já carregadas pelos hooks — o backend ainda
// não tem endpoints de agregação.
//
// Lançamentos guardam `valor` sempre positivo; a direção vem de `tipo`.
import type {
  Categoria, CategoriaExecucao, Conta, ExecucaoProjeto, Lancamento, Orcamento, Projeto,
} from "@/types/financeiro";
import { dataLocal } from "./format";

export type PeriodoDash = "semana" | "mes" | "trimestre" | "ano" | "todos" | "personalizado";

// Limite `null` = aberto: sem início é "até a data final", sem fim é "a partir
// da data inicial" e sem nenhum dos dois é todo o período.
export interface Intervalo {
  inicio: Date | null;
  fim: Date | null;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getIntervaloPeriodo(
  periodo: PeriodoDash,
  hoje: Date = new Date(),
  dataIni?: string,
  dataFim?: string,
): Intervalo {
  const fimHoje = new Date(hoje);
  fimHoje.setHours(23, 59, 59, 999);

  switch (periodo) {
    case "semana":
      return { inicio: startOfWeek(hoje), fim: fimHoje };
    case "mes":
      return { inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1), fim: fimHoje };
    case "trimestre":
      return { inicio: new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1), fim: fimHoje };
    case "ano":
      return { inicio: new Date(hoje.getFullYear(), 0, 1), fim: fimHoje };
    case "todos":
      return { inicio: null, fim: null };
    case "personalizado":
      // Campo vazio deixa aquele lado em aberto; os dois limites são inclusivos.
      return {
        inicio: dataIni ? dataLocal(dataIni) : null,
        fim: dataFim ? new Date(dataLocal(dataFim).setHours(23, 59, 59, 999)) : null,
      };
  }
}

/** Falso quando a data inicial é posterior à final, o que não seleciona nada. */
export function intervaloValido(intervalo: Intervalo): boolean {
  return !intervalo.inicio || !intervalo.fim || intervalo.inicio <= intervalo.fim;
}

/** Data que situa o lançamento no tempo: competência, senão pagamento, senão criação. */
export function dataDoLancamento(l: Lancamento): string {
  return l.dataCompetencia ?? l.dataPagamento ?? l.criadoEm;
}

function dentroDoIntervalo(l: Lancamento, intervalo: Intervalo): boolean {
  const data = dataLocal(dataDoLancamento(l));
  return (!intervalo.inicio || data >= intervalo.inicio) && (!intervalo.fim || data <= intervalo.fim);
}

/** Lançamentos do intervalo — a mesma lista alimenta a tabela e os totais. */
export function filtrarPorIntervalo(lancamentos: Lancamento[], intervalo: Intervalo): Lancamento[] {
  return lancamentos.filter((l) => dentroDoIntervalo(l, intervalo));
}

function soma(lancamentos: Lancamento[]): number {
  return lancamentos.reduce((a, b) => a + b.valor, 0);
}

export interface ResumoPeriodo {
  entradas: number;
  saidas: number;
  qtdLancamentos: number;
}

export function resumoPeriodo(lancamentos: Lancamento[], intervalo: Intervalo): ResumoPeriodo {
  const doPeriodo = filtrarPorIntervalo(lancamentos, intervalo);
  return {
    entradas: soma(doPeriodo.filter((l) => l.tipo === "entrada")),
    saidas: soma(doPeriodo.filter((l) => l.tipo === "saida")),
    qtdLancamentos: doPeriodo.length,
  };
}

export function saldoTotalContas(contas: Conta[]): number {
  return contas.reduce((a, b) => a + b.saldoAtual, 0);
}

export interface ContaPendente {
  descricao: string;
  valor: number;
  vencimento: string; // ISO
  tipo: "receber" | "pagar";
}

/**
 * Lançamentos pendentes (ainda não pagos/recebidos), separados entre os que já
 * venceram e os que vencem nos próximos 7 dias.
 */
export function contasPendentes(
  lancamentos: Lancamento[],
  hoje: Date = new Date(),
): { vencidas: ContaPendente[]; vencendo: ContaPendente[] } {
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const emSeteDias = new Date(inicioHoje);
  emSeteDias.setDate(emSeteDias.getDate() + 7);

  const toContaPendente = (l: Lancamento): ContaPendente => ({
    descricao: l.descricao ?? "",
    valor: l.valor,
    vencimento: dataDoLancamento(l),
    tipo: l.tipo === "entrada" ? "receber" : "pagar",
  });

  const pendentes = lancamentos.filter((l) => l.situacao === "pendente");
  const vencidas = pendentes.filter((l) => dataLocal(dataDoLancamento(l)) < inicioHoje).map(toContaPendente);
  const vencendo = pendentes
    .filter((l) => {
      const d = dataLocal(dataDoLancamento(l));
      return d >= inicioHoje && d <= emSeteDias;
    })
    .map(toContaPendente);

  return { vencidas, vencendo };
}

export interface PontoFluxo {
  mes: string;
  realizado: number;
  previsto: number;
  saidasRealizado: number;
  saidasPrevisto: number;
}

/** Série mensal de entradas/saídas realizadas vs. previstas — usada nos gráficos de fluxo de caixa. */
export function serieFluxoCaixa(lancamentos: Lancamento[], meses = 6, hoje: Date = new Date()): PontoFluxo[] {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const pontos: PontoFluxo[] = [];

  for (let i = meses - 1; i >= 0; i--) {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const doMes = lancamentos.filter((l) => {
      const d = dataLocal(dataDoLancamento(l));
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    });
    const entradas = doMes.filter((l) => l.tipo === "entrada");
    const saidas = doMes.filter((l) => l.tipo === "saida");
    pontos.push({
      mes: formatter.format(ref).replace(".", ""),
      realizado: soma(entradas.filter((l) => l.situacao === "recebido")),
      previsto: soma(entradas),
      saidasRealizado: soma(saidas.filter((l) => l.situacao === "pago")),
      saidasPrevisto: soma(saidas),
    });
  }

  return pontos;
}

export interface PontoFluxoPeriodo {
  label: string;
  entradas: number;
  saidas: number;
}

export type AgrupamentoFluxo = "semana" | "mes" | "ano";

export interface SerieFluxoPeriodo {
  agrupamento: AgrupamentoFluxo;
  pontos: PontoFluxoPeriodo[];
}

// Dia como número inteiro, imune ao horário de verão (que mudaria a conta em horas).
function numeroDoDia(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

const MAX_DIAS_POR_SEMANA = 62;
const MAX_MESES_POR_MES = 24;

/**
 * Entradas vs. saídas do período, para o gráfico de fluxo da tela Financeiro.
 * Agrupa por semana em períodos de até ~2 meses, por mês até 2 anos e por ano
 * acima disso. Um limite em aberto vai até o lançamento mais antigo/recente.
 * Semanas e meses sem lançamento aparecem zerados, para o eixo ser contínuo.
 */
export function serieFluxoPeriodo(lancamentos: Lancamento[], intervalo: Intervalo): SerieFluxoPeriodo {
  const doPeriodo = filtrarPorIntervalo(lancamentos, intervalo);
  if (doPeriodo.length === 0) return { agrupamento: "semana", pontos: [] };

  const datas = doPeriodo.map((l) => dataLocal(dataDoLancamento(l)));
  const inicio = intervalo.inicio ?? new Date(Math.min(...datas.map(Number)));
  const fim = intervalo.fim ?? new Date(Math.max(...datas.map(Number)));

  const dias = numeroDoDia(fim) - numeroDoDia(inicio) + 1;
  const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + fim.getMonth() - inicio.getMonth() + 1;
  const agrupamento: AgrupamentoFluxo =
    dias <= MAX_DIAS_POR_SEMANA ? "semana" : meses <= MAX_MESES_POR_MES ? "mes" : "ano";

  // Índice do grupo de cada data, contado a partir do início do período.
  const indice = (d: Date): number => {
    if (agrupamento === "semana") return Math.floor((numeroDoDia(d) - numeroDoDia(inicio)) / 7);
    if (agrupamento === "mes") return (d.getFullYear() - inicio.getFullYear()) * 12 + d.getMonth() - inicio.getMonth();
    return d.getFullYear() - inicio.getFullYear();
  };

  const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
  const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
  const rotulo = (i: number): string => {
    if (agrupamento === "semana") {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i * 7);
      return diaMes.format(d);
    }
    if (agrupamento === "mes") {
      return mesAno.format(new Date(inicio.getFullYear(), inicio.getMonth() + i, 1)).replace(".", "");
    }
    return String(inicio.getFullYear() + i);
  };

  const pontos: PontoFluxoPeriodo[] = Array.from({ length: indice(fim) + 1 }, (_, i) => ({
    label: rotulo(i), entradas: 0, saidas: 0,
  }));
  doPeriodo.forEach((l, i) => {
    const ponto = pontos[indice(datas[i])];
    if (l.tipo === "entrada") ponto.entradas += l.valor;
    else ponto.saidas += l.valor;
  });

  return { agrupamento, pontos };
}

export interface NoCategoria {
  categoria: Categoria;
  subcategorias: Categoria[];
}

/** Categorias principais (sem pai) com suas subcategorias, na ordem em que vieram. */
export function arvoreCategorias(categorias: Categoria[]): NoCategoria[] {
  return categorias
    .filter((c) => c.categoriaPaiId === null)
    .map((categoria) => ({
      categoria,
      subcategorias: categorias.filter((c) => c.categoriaPaiId === categoria.id),
    }));
}

/**
 * Execução orçamentária por projeto: orçado vem dos orçamentos cadastrados e
 * realizado das saídas já pagas, ambos por categoria.
 */
export function execucaoOrcamentaria(
  projetos: Projeto[],
  categorias: Categoria[],
  orcamentos: Orcamento[],
  lancamentos: Lancamento[],
): ExecucaoProjeto[] {
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));
  const pagas = lancamentos.filter((l) => l.tipo === "saida" && l.situacao === "pago");

  return projetos.flatMap((projeto) => {
    const doProjeto = orcamentos.filter((o) => o.projetoId === projeto.id);
    if (doProjeto.length === 0) return [];

    const categoriaIds = Array.from(new Set(doProjeto.map((o) => o.categoriaId)));
    const linhas: CategoriaExecucao[] = categoriaIds.map((categoriaId) => ({
      nome: nomeCategoria.get(categoriaId) ?? `Categoria ${categoriaId}`,
      orcado: doProjeto.filter((o) => o.categoriaId === categoriaId).reduce((a, b) => a + b.valorPrevisto, 0),
      realizado: soma(pagas.filter((l) => l.projetoId === projeto.id && l.categoriaId === categoriaId)),
    }));

    return [{
      projetoId: projeto.id,
      projeto: projeto.nome,
      orcado: linhas.reduce((a, b) => a + b.orcado, 0),
      realizado: linhas.reduce((a, b) => a + b.realizado, 0),
      categorias: linhas,
    }];
  });
}
