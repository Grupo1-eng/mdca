import { request } from "./client";
import type { Lancamento, NovoLancamento } from "@/types/financeiro";

export function getLancamentos(): Promise<Lancamento[]> {
  return request<Lancamento[]>("/financeiro/lancamentos");
}

export function createLancamento(input: NovoLancamento): Promise<Lancamento> {
  return request<Lancamento>("/financeiro/lancamentos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateLancamento(id: string, input: Partial<NovoLancamento>): Promise<Lancamento> {
  return request<Lancamento>(`/financeiro/lancamentos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
