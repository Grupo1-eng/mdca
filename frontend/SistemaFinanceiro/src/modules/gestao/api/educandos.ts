// Chamadas reais da Gestão para educandos e responsáveis familiares.
// Usa o cliente HTTP compartilhado (src/api/client.ts) sem modificá-lo: ele já
// envia o token e transforma respostas de erro em ApiError.
//
// Os tipos espelham o que o backend devolve hoje
// (backend/src/modules/gestao/educandos e responsaveis-familiares).
import { request } from "@/api/client"

export interface ResponsavelApi {
  id: number
  educandoId: number
  nome: string
  vinculo: string
  cpf: string | null
  rg: string | null
  telefone: string | null
  profissao: string | null
  tipoTrabalho: string | null
  localTrabalho: string | null
  escolaridade: string | null
}

export interface EducandoApi {
  id: number
  organizacaoId: number
  nome: string
  cpf: string | null
  rg: string | null
  nis: string | null
  corAutodeclarada: string | null
  dataNascimento: string | null
  endereco: string | null
  telefone: string | null
  escola: string | null
  turno: string | null
  historicoRepetencia: string | null
  numerosPessoasFamilias: number | null
  // Decimal do Prisma: chega como texto ("1500.5").
  rendaFamiliar: string | number | null
  beneficiosSociais: string | null
  tipoMoradia: string | null
  doencaCronica: string | null
  medicamentoContinuo: string | null
  observacaoSaude: string | null
  situacaoAtual: string
  tecnicoResponsavelId: number | null
  // Só vem em GET /api/educandos/:id.
  responsaveis?: ResponsavelApi[]
  // Colunas da migration 20261029180000_gestao_sprint3_campos. Ausentes até
  // ela ser aplicada no banco.
  genero?: string | null
  serie?: string | null
  origemEncaminhamento?: string | null
  motivosIngresso?: string[]
}

export type EducandoPayload = Partial<
  Omit<EducandoApi, "id" | "organizacaoId" | "situacaoAtual" | "responsaveis">
> & { nome: string }

export type ResponsavelPayload = Omit<ResponsavelApi, "id">

export function listarEducandos(): Promise<EducandoApi[]> {
  // A tela filtra ativos/inativos localmente e precisa dos inativos para
  // a verificação de CPF/NIS duplicado.
  return request<EducandoApi[]>("/api/educandos?apenasAtivos=false")
}

export function buscarEducando(id: number): Promise<EducandoApi> {
  return request<EducandoApi>(`/api/educandos/${id}`)
}

export function criarEducando(dados: EducandoPayload): Promise<EducandoApi> {
  return request<EducandoApi>("/api/educandos", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

export function atualizarEducando(
  id: number,
  dados: EducandoPayload,
): Promise<EducandoApi> {
  return request<EducandoApi>(`/api/educandos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  })
}

export function inativarEducando(id: number): Promise<EducandoApi> {
  return request<EducandoApi>(`/api/educandos/${id}/inativar`, {
    method: "PATCH",
  })
}

export function reativarEducando(id: number): Promise<EducandoApi> {
  return request<EducandoApi>(`/api/educandos/${id}/reativar`, {
    method: "PATCH",
  })
}

export function criarResponsavel(
  dados: ResponsavelPayload,
): Promise<ResponsavelApi> {
  return request<ResponsavelApi>("/api/responsaveis-familiares", {
    method: "POST",
    body: JSON.stringify(dados),
  })
}

export function atualizarResponsavel(
  id: number,
  dados: ResponsavelPayload,
): Promise<ResponsavelApi> {
  return request<ResponsavelApi>(`/api/responsaveis-familiares/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  })
}
