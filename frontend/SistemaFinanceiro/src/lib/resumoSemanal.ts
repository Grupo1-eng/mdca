// Apoio ao gráfico semanal do mês (US10 / RF30), que usa o endpoint
// GET /api/lancamentos/resumo-semanal?mes=AAAA-MM do backend.
import type { Intervalo } from "./aggregations";
import type { SemanaResumo } from "@/types/financeiro";

function paraMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Mês que o gráfico semanal abre a partir do período do filtro: o mês de hoje
 * quando hoje está no período (ou o período é aberto); senão, o mês do início,
 * ou do fim quando só ele existe.
 */
export function mesDoPeriodo(intervalo: Intervalo, hoje: Date = new Date()): string {
  const depoisDoInicio = !intervalo.inicio || hoje >= intervalo.inicio;
  const antesDoFim = !intervalo.fim || hoje <= intervalo.fim;
  if (depoisDoInicio && antesDoFim) return paraMes(hoje);
  return paraMes(intervalo.inicio ?? (intervalo.fim as Date));
}

/** Mês `n` meses depois (negativo: antes) de `mes`, no formato AAAA-MM. */
export function somarMeses(mes: string, n: number): string {
  const [ano, numero] = mes.split("-").map(Number);
  return paraMes(new Date(ano, numero - 1 + n, 1));
}

/** "01/11 – 07/11": identifica a semana no eixo e na tabela. */
export function rotuloSemana(semana: Pick<SemanaResumo, "inicio" | "fim">): string {
  const diaMes = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return `${diaMes(semana.inicio)} – ${diaMes(semana.fim)}`;
}

/** "novembro de 2026", para o título do gráfico. */
export function nomeDoMes(mes: string): string {
  const [ano, numero] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(ano, numero - 1, 1));
}
