// Projeto é a mesma tabela do Financeiro. A Gestão só consulta e, na
// coordenação, cadastra e edita. Não há coluna de código: o id do banco
// identifica a iniciativa.
import { getToken, request } from "@/api/client"

export const TIPOS_PROJETO = ["PROJETO", "SERVICO", "PROGRAMA"] as const
export type TipoProjetoApi = (typeof TIPOS_PROJETO)[number]

export interface ProjetoApi {
  id: number
  organizacaoId: number
  nome: string
  descricao: string | null
  tipo: string
  status: string
  orcamentoTotal: string | number | null
  dataInicio: string | null
  dataFim: string | null
}

export interface ProjetoPayload {
  nome: string
  descricao: string | null
  tipo: TipoProjetoApi
  status: string
  orcamentoTotal: string | null
  dataInicio: string | null
  dataFim: string | null
}

export function listarProjetos(): Promise<ProjetoApi[]> {
  return request<ProjetoApi[]>("/api/projetos")
}

export function criarProjeto(dados: ProjetoPayload): Promise<ProjetoApi> {
  return request<ProjetoApi>("/api/projetos", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

export function atualizarProjeto(
  id: number,
  dados: ProjetoPayload,
): Promise<ProjetoApi> {
  return request<ProjetoApi>(`/api/projetos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  })
}

// O login não devolve a organização, mas o token já traz organizacaoId.
// GET /api/projetos ainda lista todas as organizações; a tela usa este
// valor só para não mostrar as outras.
export function organizacaoIdDoToken(token: string | null = getToken()): number | null {
  if (!token) return null
  const parte = token.split(".")[1]
  if (!parte) return null
  try {
    const base64 = parte.replace(/-/g, "+").replace(/_/g, "/")
    const preenchido = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const json = JSON.parse(atob(preenchido)) as { organizacaoId?: unknown }
    return typeof json.organizacaoId === "number" ? json.organizacaoId : null
  } catch {
    return null
  }
}
