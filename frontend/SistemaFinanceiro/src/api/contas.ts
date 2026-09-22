import { request } from "./client";
import type { Conta, NovaConta } from "@/types/financeiro";

export function getContas(): Promise<Conta[]> {
  return request<Conta[]>("/financeiro/contas");
}

export function createConta(input: NovaConta): Promise<Conta> {
  return request<Conta>("/financeiro/contas", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateConta(id: string, input: Partial<NovaConta>): Promise<Conta> {
  return request<Conta>(`/financeiro/contas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
