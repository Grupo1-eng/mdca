import { request } from "./client";
import type { Categoria, NovaCategoria } from "@/types/financeiro";

export function getCategorias(): Promise<Categoria[]> {
  return request<Categoria[]>("/financeiro/categorias");
}

export function createCategoria(input: NovaCategoria): Promise<Categoria> {
  return request<Categoria>("/financeiro/categorias", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategoria(id: string, input: Partial<NovaCategoria>): Promise<Categoria> {
  return request<Categoria>(`/financeiro/categorias/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
