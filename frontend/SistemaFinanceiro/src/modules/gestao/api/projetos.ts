// Projeto é a mesma tabela do Financeiro, mas o cadastro é da Gestão
// (combinado com o Financeiro). Usa as rotas da Gestão em /api/iniciativas,
// que já filtram a organização do usuário; só a coordenação cadastra e edita.
// Não há coluna de código: o id do banco identifica a iniciativa.
import { request } from "@/api/client"

export const TIPOS_PROJETO = ["PROJETO", "SERVICO", "PROGRAMA"] as const
export type TipoProjetoApi = (typeof TIPOS_PROJETO)[number]

export interface ProjetoApi {
  id: number
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
  return request<ProjetoApi[]>("/api/iniciativas")
}

export function criarProjeto(dados: ProjetoPayload): Promise<ProjetoApi> {
  return request<ProjetoApi>("/api/iniciativas", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

export function atualizarProjeto(
  id: number,
  dados: ProjetoPayload,
): Promise<ProjetoApi> {
  return request<ProjetoApi>(`/api/iniciativas/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  })
}
