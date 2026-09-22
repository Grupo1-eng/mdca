import { request } from "./client";
import type { Projeto, NovoProjeto } from "@/types/financeiro";

export function getProjetos(): Promise<Projeto[]> {
  return request<Projeto[]>("/financeiro/projetos");
}

export function createProjeto(input: NovoProjeto): Promise<Projeto> {
  return request<Projeto>("/financeiro/projetos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProjeto(id: string, input: Partial<NovoProjeto>): Promise<Projeto> {
  return request<Projeto>(`/financeiro/projetos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
