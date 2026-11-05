import { request } from "./client";
import { recurso } from "./recurso";
import { normalizarLancamento, normalizarResumoSemanal, type ResumoSemanalApi } from "./normalizar";
import type { Lancamento, NovoLancamento, ResumoSemanal } from "@/types/financeiro";
import type { FiltroProjeto } from "@/lib/aggregations";
import { queryResumoSemanal } from "@/lib/resumoSemanal";

const api = recurso<Lancamento, NovoLancamento, Parameters<typeof normalizarLancamento>[0]>("/api/lancamentos", normalizarLancamento);

export const getLancamentos = api.listar;
export const createLancamento = api.criar;
export const updateLancamento = api.atualizar;

/** Entradas e saídas de cada semana do mês (US10), opcionalmente de um projeto. `mes` no formato AAAA-MM. */
export async function getResumoSemanal(mes: string, projeto: FiltroProjeto = "todos"): Promise<ResumoSemanal> {
  const resposta = await request<ResumoSemanalApi>(`/api/lancamentos/resumo-semanal${queryResumoSemanal(mes, projeto)}`);
  return normalizarResumoSemanal(resposta);
}
