// Chamadas reais da Agenda (backend/src/modules/gestao/compromissos).
// Qualquer usuário autenticado da organização acessa; o criador vem do token.
import { request } from "@/api/client"

export interface CompromissoApi {
  id: number
  criadorId: number
  titulo: string
  tipo: string | null
  descricao: string | null
  dataInicio: string
  dataFim: string | null
  // "agendado" | "realizado" | "cancelado"
  situacao: string
  criador?: { id: number; nome: string }
  // Coluna da migration da Sprint 3; ausente até ela ser aplicada.
  local?: string | null
}

export interface CompromissoPayload {
  titulo: string
  tipo: string
  descricao: string | null
  dataInicio: string
  local?: string | null
}

export function listarCompromissos(): Promise<CompromissoApi[]> {
  return request<CompromissoApi[]>("/api/compromissos")
}

export function criarCompromisso(
  dados: CompromissoPayload,
): Promise<CompromissoApi> {
  return request<CompromissoApi>("/api/compromissos", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

export function atualizarCompromisso(
  id: number,
  dados: Partial<CompromissoPayload> & { situacao?: string },
): Promise<CompromissoApi> {
  return request<CompromissoApi>(`/api/compromissos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  })
}

// Cancelar preserva o registro (RN05).
export function cancelarCompromisso(id: number): Promise<CompromissoApi> {
  return request<CompromissoApi>(`/api/compromissos/${id}/cancelar`, {
    method: "PATCH",
  })
}
