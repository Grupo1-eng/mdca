// Conversões puras entre a API de atividades, encontros e frequência
// (backend/src/modules/gestao/{atividades,encontros,frequencias}) e os tipos
// da tela. Sem chamadas de rede, para poder testar.
import type {
  Atividade,
  Chamada,
  Encontro,
  LinhaChamada,
  RegistroFrequencia,
  ResponsavelAtividade,
  SituacaoAtividade,
  SituacaoEncontro,
} from "../educandos/types"

// ── Formatos da API ─────────────────────────────────────────────────────────

export interface AtividadeApi {
  id: number
  projetoId: number
  responsavelId: number
  nome: string
  descricao: string | null
  situacao: string
  projeto?: { id: number; nome: string } | null
  responsavel?: { id: number; nome: string } | null
  encontros?: { situacao: string }[]
}

export interface AtividadePayload {
  projetoId: number
  responsavelId: number
  nome: string
  descricao: string | null
  situacao: "ativa" | "encerrada"
}

export interface EncontroApi {
  id: number
  atividadeId: number
  dataInicio: string | null
  horaInicio: string | null
  horaFim: string | null
  local: string | null
  observacoes: string | null
  situacao: string
  _count?: { frequencias: number }
}

export interface EncontroPayload {
  data: string
  horaInicio: string | null
  horaFim: string | null
  local: string | null
  observacoes: string | null
  situacao: "agendado" | "realizado" | "cancelado"
}

export interface ChamadaApi {
  aceitaChamada: boolean
  linhas: {
    educandoId: number
    nome: string
    presente: boolean | null
    observacao: string | null
    desvinculado: boolean
  }[]
}

export interface RegistroChamadaPayload {
  registros: { educandoId: number; presente: boolean; observacao: string | null }[]
}

export interface FrequenciaApi {
  presencaAusencia: string
  observacao: string | null
  encontro: {
    id: number
    dataInicio: string | null
    horaInicio: string | null
    situacao: string
    atividade: { nome: string; projeto: { nome: string } | null } | null
  }
}

// ── Situações ───────────────────────────────────────────────────────────────

const SITUACAO_ENCONTRO_TELA: Record<string, SituacaoEncontro> = {
  agendado: "Planejado",
  realizado: "Realizado",
  cancelado: "Cancelado",
}

const SITUACAO_ENCONTRO_API: Record<SituacaoEncontro, EncontroPayload["situacao"]> = {
  Planejado: "agendado",
  Realizado: "realizado",
  Cancelado: "cancelado",
}

export function situacaoEncontroTela(situacao: string): SituacaoEncontro {
  return SITUACAO_ENCONTRO_TELA[situacao?.toLowerCase()] ?? "Planejado"
}

export function situacaoAtividadeTela(situacao: string): SituacaoAtividade {
  return situacao?.toLowerCase() === "encerrada" ? "Encerrada" : "Ativa"
}

// ── Conversões ──────────────────────────────────────────────────────────────

const texto = (valor: string | null | undefined) => valor ?? ""
const textoOuNulo = (valor: string) => valor.trim() || null

// "2026-11-20T00:00:00.000Z" → "2026-11-20" (a data é guardada só como dia).
export function diaDaApi(valor: string | null): string {
  return valor ? valor.slice(0, 10) : ""
}

export function deAtividadeApi(api: AtividadeApi): Atividade {
  const encontros = api.encontros ?? []
  return {
    id: String(api.id),
    nome: api.nome,
    iniciativaId: String(api.projetoId),
    iniciativaNome: api.projeto?.nome ?? "—",
    responsavelId: String(api.responsavelId),
    responsavelNome: api.responsavel?.nome ?? "—",
    situacao: situacaoAtividadeTela(api.situacao),
    descricao: texto(api.descricao),
    encontrosTotal: encontros.length,
    encontrosRealizados: encontros.filter((e) => e.situacao === "realizado").length,
  }
}

export function paraAtividadePayload(atividade: Atividade): AtividadePayload {
  return {
    projetoId: Number(atividade.iniciativaId),
    responsavelId: Number(atividade.responsavelId),
    nome: atividade.nome.trim(),
    descricao: textoOuNulo(atividade.descricao),
    situacao: atividade.situacao === "Encerrada" ? "encerrada" : "ativa",
  }
}

export function deResponsavelApi(api: { id: number; nome: string }): ResponsavelAtividade {
  return { id: String(api.id), nome: api.nome }
}

export function deEncontroApi(api: EncontroApi): Encontro {
  return {
    id: String(api.id),
    atividadeId: String(api.atividadeId),
    data: diaDaApi(api.dataInicio),
    horaInicio: texto(api.horaInicio),
    horaFim: texto(api.horaFim),
    local: texto(api.local),
    observacoes: texto(api.observacoes),
    situacao: situacaoEncontroTela(api.situacao),
    presencasRegistradas: api._count?.frequencias ?? 0,
  }
}

export function paraEncontroPayload(encontro: Encontro): EncontroPayload {
  return {
    data: encontro.data,
    horaInicio: textoOuNulo(encontro.horaInicio),
    horaFim: textoOuNulo(encontro.horaFim),
    local: textoOuNulo(encontro.local),
    observacoes: textoOuNulo(encontro.observacoes),
    situacao: SITUACAO_ENCONTRO_API[encontro.situacao],
  }
}

export function deChamadaApi(api: ChamadaApi): Chamada {
  return {
    aceitaChamada: api.aceitaChamada,
    linhas: api.linhas.map(
      (l): LinhaChamada => ({
        educandoId: String(l.educandoId),
        nome: l.nome,
        presente: l.presente,
        observacao: texto(l.observacao),
        desvinculado: l.desvinculado,
      }),
    ),
  }
}

// Só envia quem já tem presença ou ausência marcada.
export function paraRegistroChamada(linhas: LinhaChamada[]): RegistroChamadaPayload {
  return {
    registros: linhas
      .filter((l) => l.presente !== null)
      .map((l) => ({
        educandoId: Number(l.educandoId),
        presente: l.presente === true,
        observacao: textoOuNulo(l.observacao),
      })),
  }
}

export function deFrequenciaApi(api: FrequenciaApi): RegistroFrequencia {
  return {
    encontroId: String(api.encontro.id),
    data: diaDaApi(api.encontro.dataInicio),
    horaInicio: texto(api.encontro.horaInicio),
    situacaoEncontro: situacaoEncontroTela(api.encontro.situacao),
    atividadeNome: api.encontro.atividade?.nome ?? "—",
    iniciativaNome: api.encontro.atividade?.projeto?.nome ?? "—",
    presente: api.presencaAusencia === "presente",
    observacao: texto(api.observacao),
  }
}

// Taxa de presença só nos encontros realizados: cancelado não conta (RN05)
// e planejado ainda não aconteceu.
export function resumoFrequencia(registros: RegistroFrequencia[]) {
  const realizados = registros.filter((r) => r.situacaoEncontro === "Realizado")
  const presentes = realizados.filter((r) => r.presente).length
  return {
    realizados: realizados.length,
    presentes,
    taxa: realizados.length ? Math.round((presentes / realizados.length) * 100) : null,
  }
}
