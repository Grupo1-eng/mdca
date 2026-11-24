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
  // Ligado a uma evolução sigilosa que o usuário não pode ver: o backend
  // devolve sem a descrição e sem as observações dos acompanhamentos.
  conteudoOculto?: boolean
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
  // Quem registrou; o perfil decide quem vê uma evolução sigilosa.
  profissional?: { id: number; nome: string; perfil?: string }
  // Colunas da migration da Sprint 3; ausentes até ela ser aplicada.
  intervencaoUsuario?: string | null
  intervencaoFamilia?: string | null
  sigiloso?: boolean
  // Sigilosa de outro serviço: o backend devolve sem titulo, descricao e
  // intervenções (só o serviço de quem registrou e a coordenação veem).
  conteudoOculto?: boolean
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

// Painel dos técnicos (GET /api/encaminhamentos/em-aberto): não efetivados,
// mais antigos primeiro. Sem descrição nem acompanhamentos.
export interface EncaminhamentoEmAbertoApi {
  id: number
  destino: string | null
  dataEncaminhamento: string
  situacaoAtual: string
  educando: { id: number; nome: string }
}

export function listarEncaminhamentosEmAberto(): Promise<EncaminhamentoEmAbertoApi[]> {
  return request<EncaminhamentoEmAbertoApi[]>("/api/encaminhamentos/em-aberto")
}

// Painel dos técnicos (GET /api/evolucoes/recentes): últimos atendimentos da
// organização, sem nenhum texto.
export interface AtendimentoRecenteApi {
  id: number
  tipo: string | null
  dataInicio: string
  sigiloso: boolean
  educando: { id: number; nome: string }
  profissional: { id: number; nome: string }
}

export function listarAtendimentosRecentes(): Promise<AtendimentoRecenteApi[]> {
  return request<AtendimentoRecenteApi[]>("/api/evolucoes/recentes")
}

