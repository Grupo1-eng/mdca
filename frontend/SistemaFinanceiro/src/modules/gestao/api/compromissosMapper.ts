// Conversão entre a Agenda (data e horário separados, status capitalizado) e
// o backend (dataInicio ISO, situação em minúsculas). Funções puras.
import type {
  Compromisso,
  DadosEditaveisCompromisso,
  StatusCompromisso,
  TipoCompromisso,
} from "../agenda/types"
import type { CompromissoApi, CompromissoPayload } from "./compromissos"
import { CAMPOS_AGUARDANDO_MIGRACAO } from "./educandosMapper"
import { dataHoraLocalParaIso, isoParaDataHoraLocal } from "./evolucoesMapper"

const TIPOS: TipoCompromisso[] = [
  "Atendimento",
  "Reunião",
  "Visita domiciliar",
  "Encontro de atividade",
]

// O backend aceita texto livre; valores fora da lista da tela viram "Reunião".
export function tipoParaTela(valor: string | null): TipoCompromisso {
  return TIPOS.find((tipo) => tipo === valor) ?? "Reunião"
}

export function situacaoParaTela(valor: string): StatusCompromisso {
  const normalizado = valor.trim().toLowerCase()
  if (normalizado === "realizado") return "Realizado"
  if (normalizado === "cancelado") return "Cancelado"
  return "Agendado"
}

export function situacaoParaApi(valor: StatusCompromisso): string {
  return valor.toLowerCase()
}

export function deCompromissoApi(api: CompromissoApi): Compromisso {
  const [data, horario] = isoParaDataHoraLocal(api.dataInicio).split("T")
  return {
    id: String(api.id),
    titulo: api.titulo,
    data,
    horario,
    local: api.local ?? "",
    responsavel: api.criador?.nome ?? "",
    tipo: tipoParaTela(api.tipo),
    status: situacaoParaTela(api.situacao),
    observacoes: api.descricao ?? "",
  }
}

export function paraCompromissoPayload(
  dados: DadosEditaveisCompromisso,
): CompromissoPayload {
  const titulo = dados.titulo.trim()
  if (!titulo || !dados.data) {
    throw new Error("O compromisso precisa de título e data.")
  }
  const payload: CompromissoPayload = {
    titulo,
    tipo: dados.tipo,
    descricao: dados.observacoes.trim() || null,
    dataInicio: dataHoraLocalParaIso(`${dados.data}T${dados.horario || "00:00"}`),
  }
  if (!CAMPOS_AGUARDANDO_MIGRACAO) {
    payload.local = dados.local.trim() || null
  }
  return payload
}
