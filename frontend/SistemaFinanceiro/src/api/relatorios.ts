import { request } from "./client";
import type { ExecucaoProjeto, BalanceteFonte } from "@/types/financeiro";

export function getExecucaoOrcamentaria(): Promise<ExecucaoProjeto[]> {
  return request<ExecucaoProjeto[]>("/financeiro/relatorios/execucao-orcamentaria");
}

export function getBalancete(): Promise<BalanceteFonte[]> {
  return request<BalanceteFonte[]>("/financeiro/relatorios/balancete");
}
