import { request } from "./client";
import type { Contato, NovoContato } from "@/types/financeiro";

export function getContatos(): Promise<Contato[]> {
  return request<Contato[]>("/financeiro/contatos");
}

export function createContato(input: NovoContato): Promise<Contato> {
  return request<Contato>("/financeiro/contatos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateContato(id: string, input: Partial<NovoContato>): Promise<Contato> {
  return request<Contato>(`/financeiro/contatos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
