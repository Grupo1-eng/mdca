import { request } from "./client";
import { recurso } from "./recurso";
import { normalizarLancamento, normalizarResumoSemanal, type ResumoSemanalApi } from "./normalizar";
import type { Lancamento, NovoLancamento, ResumoSemanal } from "@/types/financeiro";

const api = recurso<Lancamento, NovoLancamento, Parameters<typeof normalizarLancamento>[0]>("/api/lancamentos", normalizarLancamento);

export const getLancamentos = api.listar;
export const createLancamento = api.criar;
export const updateLancamento = api.atualizar;

/** Entradas e saídas de cada semana do mês (US10). `mes` no formato AAAA-MM. */
export async function getResumoSemanal(mes: string): Promise<ResumoSemanal> {
  const resposta = await request<ResumoSemanalApi>(`/api/lancamentos/resumo-semanal?mes=${encodeURIComponent(mes)}`);
  return normalizarResumoSemanal(resposta);
}
