// Conversão entre a linha do tempo da ficha (Atendimento, Encaminhamento) e o
// formato do backend. Funções puras.
import type {
  AcompanhamentoEncaminhamento,
  Atendimento,
  Encaminhamento,
  StatusEncaminhamento,
} from "../educandos/types"
import { CAMPOS_AGUARDANDO_MIGRACAO } from "./educandosMapper"
import type {
  AcompanhamentoApi,
  AcompanhamentoPayload,
  EncaminhamentoApi,
  EncaminhamentoPayload,
  EvolucaoApi,
  EvolucaoPayload,
} from "./evolucoes"

const dois = (n: number) => String(n).padStart(2, "0")

// ISO do servidor -> "AAAA-MM-DDTHH:mm" no fuso do navegador.
export function isoParaDataHoraLocal(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`
}

// ISO do servidor -> "AAAA-MM-DD" no fuso do navegador.
export function isoParaDataLocal(iso: string): string {
  return isoParaDataHoraLocal(iso).slice(0, 10)
}

// "AAAA-MM-DDTHH:mm" (fuso do navegador) -> ISO em UTC.
export function dataHoraLocalParaIso(valor: string): string {
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) throw new Error("Data e hora inválidas.")
  return d.toISOString()
}

// "AAAA-MM-DD" -> ISO ao meio-dia local, para a data não "voltar" um dia
// ao ser convertida para UTC.
export function dataLocalParaIso(valor: string): string {
  return dataHoraLocalParaIso(`${valor}T12:00`)
}

export function statusParaTela(valor: string | null | undefined): StatusEncaminhamento {
  const normalizado = (valor ?? "").trim().toLowerCase()
  if (normalizado === "pendente") return "Pendente"
  if (normalizado === "efetivado") return "Efetivado"
  return "Em andamento"
}

export function statusParaApi(valor: StatusEncaminhamento): string {
  return valor.toLowerCase()
}

export function deEvolucaoApi(api: EvolucaoApi): Atendimento {
  return {
    id: String(api.id),
    educandoId: String(api.educandoId),
    profissional: api.profissional?.nome ?? "—",
    // O backend não devolve o perfil do profissional.
    perfilProfissional: "",
    dataHora: isoParaDataHoraLocal(api.dataInicio),
    registro: api.descricao ?? "",
    intervencaoUsuario: api.intervencaoUsuario ?? "",
    intervencaoFamilia: api.intervencaoFamilia ?? "",
    sigiloso: api.sigiloso ?? false,
  }
}

export function deAcompanhamentoApi(
  api: AcompanhamentoApi,
): AcompanhamentoEncaminhamento {
  return {
    id: String(api.id),
    data: isoParaDataLocal(api.data),
    situacao: statusParaTela(api.situacao),
    observacao: api.observacao ?? "",
  }
}

export function deEncaminhamentoApi(api: EncaminhamentoApi): Encaminhamento {
  return {
    id: String(api.id),
    educandoId: String(api.educandoId),
    profissional: api.profissional?.nome ?? "",
    dataHora: isoParaDataHoraLocal(api.dataEncaminhamento),
    destino: api.destino ?? "",
    // O "Motivo" da tela é a coluna `descricao` do banco.
    motivo: api.descricao ?? "",
    situacao: statusParaTela(api.situacaoAtual),
    acompanhamentos: (api.acompanhamentos ?? []).map(deAcompanhamentoApi),
  }
}

export interface FormAtendimento {
  dataHora: string
  registro: string
  intervencaoUsuario: string
  intervencaoFamilia: string
  sigiloso: boolean
}

export function paraEvolucaoPayload(
  educandoId: string,
  form: FormAtendimento,
): EvolucaoPayload {
  const descricao = form.registro.trim()
  if (!descricao) throw new Error("Descreva o atendimento.")
  const payload: EvolucaoPayload = {
    educandoId: Number(educandoId),
    tipo: "atendimento",
    descricao,
    dataInicio: dataHoraLocalParaIso(form.dataHora),
  }
  if (!CAMPOS_AGUARDANDO_MIGRACAO) {
    payload.intervencaoUsuario = form.intervencaoUsuario.trim() || null
    payload.intervencaoFamilia = form.intervencaoFamilia.trim() || null
    payload.sigiloso = form.sigiloso
  }
  return payload
}

export function paraEncaminhamentoPayload(
  educandoId: string,
  form: { destino: string; motivo: string },
  agora: Date = new Date(),
): EncaminhamentoPayload {
  const payload: EncaminhamentoPayload = {
    educandoId: Number(educandoId),
    dataEncaminhamento: agora.toISOString(),
  }
  if (!CAMPOS_AGUARDANDO_MIGRACAO) {
    const destino = form.destino.trim()
    if (!destino) throw new Error("Informe o destino do encaminhamento.")
    payload.destino = destino
    payload.descricao = form.motivo.trim() || null
  }
  return payload
}

export function paraAcompanhamentoPayload(
  encaminhamentoId: string,
  form: { data: string; situacao: StatusEncaminhamento; observacao: string },
): AcompanhamentoPayload {
  const observacao = form.observacao.trim()
  if (!observacao) throw new Error("Descreva o acompanhamento.")
  return {
    encaminhamentoId: Number(encaminhamentoId),
    situacao: statusParaApi(form.situacao),
    data: dataLocalParaIso(form.data),
    observacao,
  }
}
