import { request } from "./client";
import type { Fonte, NovaFonte } from "@/types/financeiro";

export function getFontes(): Promise<Fonte[]> {
  return request<Fonte[]>("/financeiro/fontes");
}

export function createFonte(input: NovaFonte): Promise<Fonte> {
  return request<Fonte>("/financeiro/fontes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateFonte(id: string, input: Partial<NovaFonte>): Promise<Fonte> {
  return request<Fonte>(`/financeiro/fontes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
