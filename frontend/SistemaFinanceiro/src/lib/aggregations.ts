// Funções puras que derivam os números do Dashboard e do fluxo de caixa a
// partir dos lançamentos/contas já carregados pelos hooks — evita expor
// endpoints de agregação que o backend não definiu para números que dá para
// calcular a partir das listas simples (lançamentos, contas).
import type { Conta, Lancamento } from "@/types/financeiro";

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
        inicio: dataIni ? new Date(dataIni) : new Date(hoje.getFullYear(), hoje.getMonth(), 1),
        fim: dataFim ? new Date(dataFim) : fimHoje,
      };
  }
}

function dentroDoIntervalo(dataIso: string, intervalo: Intervalo): boolean {
  const data = new Date(dataIso);
  return data >= intervalo.inicio && data <= intervalo.fim;
}

export interface ResumoPeriodo {
  entradas: number;
  saidas: number;
  qtdLancamentos: number;
}

export function resumoPeriodo(lancamentos: Lancamento[], intervalo: Intervalo): ResumoPeriodo {
  const doPeriodo = lancamentos.filter((l) => dentroDoIntervalo(l.data, intervalo));
  return {
    entradas: doPeriodo.filter((l) => l.tipo === "entrada").reduce((a, b) => a + b.valor, 0),
    saidas: doPeriodo.filter((l) => l.tipo === "saida").reduce((a, b) => a + Math.abs(b.valor), 0),
    qtdLancamentos: doPeriodo.length,
  };
}

export function saldoTotalContas(contas: Conta[]): number {
  return contas.reduce((a, b) => a + b.saldo, 0);
}

export interface ContaPendente {
  descricao: string;
  valor: number;
  vencimento: string; // ISO
  tipo: "receber" | "pagar";
}

/**
 * Lançamentos com situação "Previsto" (ainda não liquidados), separados entre
 * os que já venceram e os que vencem nos próximos 7 dias.
 */
export function contasPendentes(
  lancamentos: Lancamento[],
  hoje: Date = new Date(),
): { vencidas: ContaPendente[]; vencendo: ContaPendente[] } {
  const emSeteDias = new Date(hoje);
  emSeteDias.setDate(emSeteDias.getDate() + 7);

  const toContaPendente = (l: Lancamento): ContaPendente => ({
    descricao: l.descricao,
    valor: Math.abs(l.valor),
    vencimento: l.data,
    tipo: l.tipo === "entrada" ? "receber" : "pagar",
  });

  const previstos = lancamentos.filter((l) => l.situacao === "Previsto");
  const vencidas = previstos.filter((l) => new Date(l.data) < hoje).map(toContaPendente);
  const vencendo = previstos
    .filter((l) => {
      const d = new Date(l.data);
      return d >= hoje && d <= emSeteDias;
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
      const d = new Date(l.data);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    });
    const entradas = doMes.filter((l) => l.tipo === "entrada");
    const saidas = doMes.filter((l) => l.tipo === "saida");
    pontos.push({
      mes: formatter.format(ref).replace(".", ""),
      realizado: entradas.filter((l) => l.situacao === "Recebido").reduce((a, b) => a + b.valor, 0),
      previsto: entradas.reduce((a, b) => a + b.valor, 0),
      saidasRealizado: saidas.filter((l) => l.situacao === "Pago").reduce((a, b) => a + Math.abs(b.valor), 0),
      saidasPrevisto: saidas.reduce((a, b) => a + Math.abs(b.valor), 0),
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
  const doMes = lancamentos.filter((l) => {
    const d = new Date(l.data);
    return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
  });

  const semanas = new Map<number, { entradas: number; saidas: number }>();
  for (const l of doMes) {
    const dia = new Date(l.data).getDate();
    const semana = Math.floor((dia - 1) / 7) + 1;
    const atual = semanas.get(semana) ?? { entradas: 0, saidas: 0 };
    if (l.tipo === "entrada") atual.entradas += l.valor;
    else atual.saidas += Math.abs(l.valor);
    semanas.set(semana, atual);
  }

  return Array.from(semanas.entries())
    .sort(([a], [b]) => a - b)
    .map(([semana, valores]) => ({ label: `Sem ${semana}`, ...valores }));
}
