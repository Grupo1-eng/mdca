import type { Perfil, SituacaoLancamento, TipoLancamento } from "@/types/financeiro";

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

/**
 * Situações que fazem sentido para cada tipo: a entrada se realiza ao ser
 * recebida, a saída ao ser paga. O backend recusa as outras combinações
 * (backend/src/modules/financeiro/lancamentos/regras-lancamento.ts).
 */
export function situacoesDoTipo(tipo: TipoLancamento): SituacaoLancamento[] {
  return tipo === "entrada" ? ["pendente", "recebido"] : ["pendente", "pago"];
}

/** Valor com sinal para exibição: saídas aparecem negativas. */
export function valorComSinal(valor: number, tipo: TipoLancamento): number {
  return tipo === "saida" ? -valor : valor;
}

export const rotuloPerfil: Record<Perfil, string> = {
  coordenador: "Coordenação",
  tecnico_servico_social: "Técnico(a) — Serviço Social",
  tecnico_psicologia: "Técnico(a) — Psicologia",
  educador: "Educador(a)",
  administrativo: "Administrativo",
  coordenador_financeiro: "Coordenação financeira",
  gestor_financeiro: "Gestão financeira",
  analista_financeiro: "Análise financeira",
};

export const PERFIS: Perfil[] = Object.keys(rotuloPerfil) as Perfil[];
