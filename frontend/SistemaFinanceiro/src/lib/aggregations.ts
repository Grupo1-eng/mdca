// Funções puras que derivam os números do Dashboard, do fluxo de caixa e dos
// relatórios a partir das listas já carregadas pelos hooks — o backend ainda
// não tem endpoints de agregação.
//
// Lançamentos guardam `valor` sempre positivo; a direção vem de `tipo`.
import type {
  Categoria, CategoriaExecucao, Conta, ExecucaoProjeto, Lancamento, Orcamento, Projeto,
} from "@/types/financeiro";
import { dataLocal } from "./format";

export type PeriodoDash = "semana" | "mes" | "trimestre" | "ano" | "personalizado";

export interface Intervalo {
  inicio: Date;
  fim: Date;
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
    case "personalizado":
      return {
        inicio: dataIni ? dataLocal(dataIni) : new Date(hoje.getFullYear(), hoje.getMonth(), 1),
        fim: dataFim ? new Date(dataLocal(dataFim).setHours(23, 59, 59, 999)) : fimHoje,
      };
  }
}

/** Data que situa o lançamento no tempo: competência, senão pagamento, senão criação. */
export function dataDoLancamento(l: Lancamento): string {
  return l.dataCompetencia ?? l.dataPagamento ?? l.criadoEm;
}

function dentroDoIntervalo(l: Lancamento, intervalo: Intervalo): boolean {
  const data = dataLocal(dataDoLancamento(l));
  return data >= intervalo.inicio && data <= intervalo.fim;
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
  const doPeriodo = lancamentos.filter((l) => dentroDoIntervalo(l, intervalo));
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

export interface PontoSemanal {
  label: string;
  entradas: number;
  saidas: number;
}

/** Entradas vs. saídas por semana do mês corrente — usado no gráfico de fluxo da tela Financeiro. */
export function serieSemanalMesAtual(lancamentos: Lancamento[], hoje: Date = new Date()): PontoSemanal[] {
  const semanas = new Map<number, { entradas: number; saidas: number }>();
  for (const l of lancamentos) {
    const d = dataLocal(dataDoLancamento(l));
    if (d.getFullYear() !== hoje.getFullYear() || d.getMonth() !== hoje.getMonth()) continue;
    const semana = Math.floor((d.getDate() - 1) / 7) + 1;
    const atual = semanas.get(semana) ?? { entradas: 0, saidas: 0 };
    if (l.tipo === "entrada") atual.entradas += l.valor;
    else atual.saidas += l.valor;
    semanas.set(semana, atual);
  }

  return Array.from(semanas.entries())
    .sort(([a], [b]) => a - b)
    .map(([semana, valores]) => ({ label: `Sem ${semana}`, ...valores }));
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
