// Funções puras que derivam os números do Dashboard, do fluxo de caixa e dos
// relatórios a partir das listas já carregadas pelos hooks — o backend ainda
// não tem endpoints de agregação.
//
// Lançamentos guardam `valor` sempre positivo; a direção vem de `tipo`.
import type {
  Categoria, CategoriaExecucao, Conta, ExecucaoProjeto, Lancamento, Orcamento, Projeto,
  TipoLancamento,
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

/** Último instante do dia `dia` de `mes`; dia 0 é o último dia do mês anterior. */
function fimDoDia(ano: number, mes: number, dia: number): Date {
  return new Date(ano, mes, dia, 23, 59, 59, 999);
}

// Os períodos vão até o fim da semana/mês/trimestre/ano, e não até hoje, para
// incluir o que já está lançado com data futura (ex.: contas a pagar do mês).
export function getIntervaloPeriodo(
  periodo: PeriodoDash,
  hoje: Date = new Date(),
  dataIni?: string,
  dataFim?: string,
): Intervalo {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  switch (periodo) {
    case "semana": {
      const inicio = startOfWeek(hoje);
      return { inicio, fim: fimDoDia(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6) };
    }
    case "mes":
      return { inicio: new Date(ano, mes, 1), fim: fimDoDia(ano, mes + 1, 0) };
    case "trimestre":
      // Os últimos 3 meses, contando o atual.
      return { inicio: new Date(ano, mes - 2, 1), fim: fimDoDia(ano, mes + 1, 0) };
    case "ano":
      return { inicio: new Date(ano, 0, 1), fim: fimDoDia(ano, 12, 0) };
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

/** Milissegundos até a próxima meia-noite local, para recalcular "hoje" na virada do dia. */
export function msAteProximoDia(agora: Date = new Date()): number {
  const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  return amanha.getTime() - agora.getTime();
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

/** Filtro de tipo da listagem: "todos" não restringe nada. */
export type FiltroTipo = "todos" | TipoLancamento;

/**
 * Lançamentos do tipo pedido (entrada ou saída). "todos" devolve a lista como
 * veio. Combina com `filtrarPorIntervalo`: primeiro o período, depois o tipo.
 */
export function filtrarPorTipo(lancamentos: Lancamento[], tipo: FiltroTipo): Lancamento[] {
  return tipo === "todos" ? lancamentos : lancamentos.filter((l) => l.tipo === tipo);
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
    entradas: soma(filtrarPorTipo(doPeriodo, "entrada")),
    saidas: soma(filtrarPorTipo(doPeriodo, "saida")),
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

function paraContaPendente(l: Lancamento): ContaPendente {
  return {
    descricao: l.descricao ?? "",
    valor: l.valor,
    vencimento: dataDoLancamento(l),
    tipo: l.tipo === "entrada" ? "receber" : "pagar",
  };
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

  const pendentes = lancamentos.filter((l) => l.situacao === "pendente");
  const vencidas = pendentes.filter((l) => dataLocal(dataDoLancamento(l)) < inicioHoje).map(paraContaPendente);
  const vencendo = pendentes
    .filter((l) => {
      const d = dataLocal(dataDoLancamento(l));
      return d >= inicioHoje && d <= emSeteDias;
    })
    .map(paraContaPendente);

  return { vencidas, vencendo };
}

/**
 * Lançamentos já pagos/recebidos no período, do mais recente ao mais antigo.
 * Ficam separados das vencidas (RF27): pendente nunca entra aqui.
 */
export function contasPagas(lancamentos: Lancamento[], intervalo: Intervalo): ContaPendente[] {
  return filtrarPorIntervalo(lancamentos, intervalo)
    .filter((l) => l.situacao !== "pendente")
    .sort((a, b) => dataLocal(dataDoLancamento(b)).getTime() - dataLocal(dataDoLancamento(a)).getTime())
    .map(paraContaPendente);
}

/** Contas na ordem do painel de saldos: ativas primeiro, cada grupo em ordem alfabética. */
export function contasParaPainel(contas: Conta[]): Conta[] {
  return [...contas].sort(
    (a, b) => Number(b.ativa) - Number(a.ativa) || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export type AgrupamentoFluxo = "semana" | "mes" | "ano";

// Dia como número inteiro, imune ao horário de verão (que mudaria a conta em horas).
function numeroDoDia(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

const MAX_DIAS_POR_SEMANA = 62;
const MAX_MESES_POR_MES = 24;

/**
 * Distribui os lançamentos do período em grupos para os gráficos de fluxo.
 * Agrupa por semana em períodos de até ~2 meses, por mês até 2 anos e por ano
 * acima disso. Um limite em aberto vai até o lançamento mais antigo/recente.
 * Semanas e meses sem lançamento aparecem zerados, para o eixo ser contínuo.
 * `vazio` cria os valores de um grupo e `somar` acumula um lançamento nele.
 */
function agruparNoPeriodo<T extends object>(
  lancamentos: Lancamento[],
  intervalo: Intervalo,
  vazio: () => T,
  somar: (ponto: T, l: Lancamento) => void,
): { agrupamento: AgrupamentoFluxo; pontos: (T & { label: string })[] } {
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
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const rotulo = (i: number): string => {
    if (agrupamento === "semana") {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i * 7);
      return diaMes.format(d);
    }
    if (agrupamento === "mes") {
      // "out/26": o formato do Intl com ano ("out de 26") é longo para o eixo.
      const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
      return `${nomeMes.format(d).replace(".", "")}/${String(d.getFullYear()).slice(-2)}`;
    }
    return String(inicio.getFullYear() + i);
  };

  const pontos = Array.from({ length: indice(fim) + 1 }, (_, i) => ({ label: rotulo(i), ...vazio() }));
  doPeriodo.forEach((l, i) => somar(pontos[indice(datas[i])], l));

  return { agrupamento, pontos };
}

export interface PontoFluxoCaixaPeriodo {
  label: string;
  realizado: number; // entradas recebidas
  previsto: number; // todas as entradas
  saidasRealizado: number; // saídas pagas
  saidasPrevisto: number; // todas as saídas
}

/**
 * Realizado vs. previsto do período — gráfico do painel e relatório de fluxo
 * de caixa. Realizado é o que foi recebido/pago; previsto, todos os
 * lançamentos. Agrupa por semana, mês ou ano conforme o tamanho do período.
 */
export function serieFluxoCaixaPeriodo(
  lancamentos: Lancamento[],
  intervalo: Intervalo,
): { agrupamento: AgrupamentoFluxo; pontos: PontoFluxoCaixaPeriodo[] } {
  return agruparNoPeriodo(
    lancamentos,
    intervalo,
    () => ({ realizado: 0, previsto: 0, saidasRealizado: 0, saidasPrevisto: 0 }),
    (ponto, l) => {
      if (l.tipo === "entrada") {
        ponto.previsto += l.valor;
        if (l.situacao === "recebido") ponto.realizado += l.valor;
      } else {
        ponto.saidasPrevisto += l.valor;
        if (l.situacao === "pago") ponto.saidasRealizado += l.valor;
      }
    },
  );
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