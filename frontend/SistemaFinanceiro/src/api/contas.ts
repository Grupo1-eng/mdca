import { recurso } from "./recurso";
import { normalizarConta } from "./normalizar";
import type { Conta, NovaConta } from "@/types/financeiro";

const api = recurso<Conta, NovaConta, Parameters<typeof normalizarConta>[0]>("/api/contas-financeiras", normalizarConta);

export const getContas = api.listar;
export const createConta = api.criar;
export const updateConta = api.atualizar;
