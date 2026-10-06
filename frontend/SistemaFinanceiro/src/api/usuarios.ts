import { request } from "./client";
import { recurso } from "./recurso";
import type { EdicaoUsuario, NovoUsuario, Usuario } from "@/types/financeiro";

// Criar, editar e inativar são exclusivos da coordenação (o backend responde 403 para os demais).
const api = recurso<Usuario, NovoUsuario & EdicaoUsuario>("/api/usuarios");

export const getUsuarios = api.listar;
export const createUsuario = (input: NovoUsuario) => api.criar(input);
export const updateUsuario = (id: number, input: EdicaoUsuario) => api.atualizar(id, input);

export function inativarUsuario(id: number): Promise<Usuario> {
  return request<Usuario>(`/api/usuarios/${id}/inativar`, { method: "PATCH" });
}
