// Chamadas reais da Gestão para evoluções (atendimentos), encaminhamentos e
// acompanhamentos. Os tipos espelham o backend
// (backend/src/modules/gestao/{evolucoes,encaminhamentos,acompanhamentos-encaminhamento}).
// Todas as rotas são restritas a coordenação e técnicos.
import { request } from "@/api/client"

export interface AcompanhamentoApi {
  id: number
  encaminhamentoId: number
  situacao: string
  data: string
  observacao: string | null
}

export interface EncaminhamentoApi {
  id: number
  educandoId: number
  evolucaoId: number | null
  dataEncaminhamento: string
  situacaoAtual: string
  acompanhamentos?: AcompanhamentoApi[]
  // Colunas das migrations da Sprint 3 (descricao vem do PR #15 e guarda o
  // motivo do encaminhamento); ausentes até elas serem aplicadas.
  descricao?: string | null
  destino?: string | null
  profissionalId?: number | null
  profissional?: { id: number; nome: string } | null
}

export interface EvolucaoApi {
  id: number
  educandoId: number
  projetoId: number | null
  profissionalId: number
  titulo: string | null
  tipo: string | null
  descricao: string | null
  dataInicio: string
  dataFim: string | null
  situacao: string
  // Só na listagem por educando.
  profissional?: { id: number; nome: string }
  // Colunas da migration da Sprint 3; ausentes até ela ser aplicada.
  intervencaoUsuario?: string | null
  intervencaoFamilia?: string | null
  sigiloso?: boolean
}

// O profissional vem do token no backend (RN03): não é enviado.
export interface EvolucaoPayload {
  educandoId: number
  tipo?: string
  descricao: string
  dataInicio: string
  intervencaoUsuario?: string | null
  intervencaoFamilia?: string | null
  sigiloso?: boolean
}

export interface EncaminhamentoPayload {
  educandoId: number
  dataEncaminhamento: string
  destino?: string | null
  descricao?: string | null
}

export interface AcompanhamentoPayload {
  encaminhamentoId: number
  situacao: string
  data: string
  observacao: string | null
}

export function listarEvolucoes(educandoId: number): Promise<EvolucaoApi[]> {
  return request<EvolucaoApi[]>(`/api/evolucoes?educandoId=${educandoId}`)
}

export function criarEvolucao(dados: EvolucaoPayload): Promise<EvolucaoApi> {
  return request<EvolucaoApi>("/api/evolucoes", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

export function listarEncaminhamentos(
  educandoId: number,
): Promise<EncaminhamentoApi[]> {
  return request<EncaminhamentoApi[]>(
    `/api/encaminhamentos?educandoId=${educandoId}`,
  )
}

export function criarEncaminhamento(
  dados: EncaminhamentoPayload,
): Promise<EncaminhamentoApi> {
  return request<EncaminhamentoApi>("/api/encaminhamentos", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

// O backend também atualiza a situação atual do encaminhamento (transação).
export function criarAcompanhamento(
  dados: AcompanhamentoPayload,
): Promise<AcompanhamentoApi> {
  return request<AcompanhamentoApi>("/api/acompanhamentos-encaminhamento", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}
