import type { SituacaoLancamento, TipoLancamento } from "@/types/financeiro";

// Valores gravados pelo backend → texto exibido na tela.
export const rotuloSituacao: Record<SituacaoLancamento, string> = {
  pendente: "Previsto",
  pago: "Pago",
  recebido: "Recebido",
};

export const corSituacao: Record<SituacaoLancamento, string> = {
  pendente: "bg-amber-100 text-amber-800",
  pago: "bg-slate-100 text-slate-600",
  recebido: "bg-emerald-100 text-emerald-800",
};

/** Valor com sinal para exibição: saídas aparecem negativas. */
export function valorComSinal(valor: number, tipo: TipoLancamento): number {
  return tipo === "saida" ? -valor : valor;
}
