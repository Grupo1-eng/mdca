// Chamadas de atividades, encontros e frequência. Todos os perfis da Gestão
// consultam; coordenação e educador gravam (o backend responde 403 aos demais).
import { request } from "@/api/client"
import type {
  Atividade,
  Chamada,
  Encontro,
  LinhaChamada,
  RegistroFrequencia,
  ResponsavelAtividade,
} from "../educandos/types"
import {
  type AtividadeApi,
  type ChamadaApi,
  type EncontroApi,
  type FrequenciaApi,
  deAtividadeApi,
  deChamadaApi,
  deEncontroApi,
  deFrequenciaApi,
  deResponsavelApi,
  paraAtividadePayload,
  paraEncontroPayload,
  paraRegistroChamada,
} from "./atividadesMapper"

const json = (dados: unknown) => JSON.stringify(dados)

// ── Atividades ──────────────────────────────────────────────────────────────

export async function listarAtividades(): Promise<Atividade[]> {
  return (await request<AtividadeApi[]>("/api/atividades")).map(deAtividadeApi)
}

export async function buscarAtividade(id: string): Promise<Atividade> {
  return deAtividadeApi(await request<AtividadeApi>(`/api/atividades/${id}`))
}

export async function listarResponsaveis(): Promise<ResponsavelAtividade[]> {
  return (
    await request<{ id: number; nome: string }[]>("/api/atividades/responsaveis")
  ).map(deResponsavelApi)
}

export async function salvarAtividadeRemota(atividade: Atividade): Promise<Atividade> {
  const corpo = json(paraAtividadePayload(atividade))
  const salva = atividade.id
    ? await request<AtividadeApi>(`/api/atividades/${atividade.id}`, { method: "PUT", body: corpo })
    : await request<AtividadeApi>("/api/atividades", { method: "POST", body: corpo })
  return deAtividadeApi(salva)
}

// ── Encontros ───────────────────────────────────────────────────────────────

export async function listarEncontros(atividadeId: string): Promise<Encontro[]> {
  return (
    await request<EncontroApi[]>(`/api/encontros?atividadeId=${encodeURIComponent(atividadeId)}`)
  ).map(deEncontroApi)
}

export async function salvarEncontroRemoto(encontro: Encontro): Promise<Encontro> {
  const payload = paraEncontroPayload(encontro)
  const salvo = encontro.id
    ? await request<EncontroApi>(`/api/encontros/${encontro.id}`, { method: "PUT", body: json(payload) })
    : await request<EncontroApi>("/api/encontros", {
        method: "POST",
        body: json({ ...payload, atividadeId: Number(encontro.atividadeId) }),
      })
  return deEncontroApi(salvo)
}

// ── Frequência ──────────────────────────────────────────────────────────────

export async function carregarChamada(encontroId: string): Promise<Chamada> {
  return deChamadaApi(await request<ChamadaApi>(`/api/frequencias/encontro/${encontroId}`))
}

export async function registrarChamada(encontroId: string, linhas: LinhaChamada[]): Promise<Chamada> {
  return deChamadaApi(
    await request<ChamadaApi>(`/api/frequencias/encontro/${encontroId}`, {
      method: "PUT",
      body: json(paraRegistroChamada(linhas)),
    }),
  )
}

export async function historicoFrequencia(educandoId: string): Promise<RegistroFrequencia[]> {
  return (await request<FrequenciaApi[]>(`/api/frequencias/educando/${educandoId}`)).map(deFrequenciaApi)
}
