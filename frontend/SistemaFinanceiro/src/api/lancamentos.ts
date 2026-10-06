import { recurso } from "./recurso";
import { normalizarLancamento } from "./normalizar";
import type { Lancamento, NovoLancamento } from "@/types/financeiro";

const api = recurso<Lancamento, NovoLancamento, Parameters<typeof normalizarLancamento>[0]>("/api/lancamentos", normalizarLancamento);

export const getLancamentos = api.listar;
export const createLancamento = api.criar;
export const updateLancamento = api.atualizar;
