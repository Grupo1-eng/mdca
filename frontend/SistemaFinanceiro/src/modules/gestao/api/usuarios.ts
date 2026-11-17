// Usuários da organização, na Gestão. Usa a rota compartilhada /api/usuarios
// (a mesma da tela do Financeiro), que já filtra a organização do token.
// Criar, editar, inativar e reativar são só da coordenação: o backend
// responde 403 para os demais perfis.
import { request } from "@/api/client"
import type { EdicaoUsuario, NovoUsuario, Usuario } from "@/types/financeiro"

export function listarUsuarios(): Promise<Usuario[]> {
  return request<Usuario[]>("/api/usuarios")
}

export function criarUsuario(dados: NovoUsuario): Promise<Usuario> {
  return request<Usuario>("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

export function atualizarUsuario(
  id: number,
  dados: EdicaoUsuario,
): Promise<Usuario> {
  return request<Usuario>(`/api/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  })
}

export function inativarUsuario(id: number): Promise<Usuario> {
  return request<Usuario>(`/api/usuarios/${id}/inativar`, { method: "PATCH" })
}

// Não há rota de reativar: a reativação é uma edição com `ativo: true`.
export function reativarUsuario(id: number): Promise<Usuario> {
  return atualizarUsuario(id, { ativo: true })
}
