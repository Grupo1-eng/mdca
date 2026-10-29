import type {
  Compromisso,
  DadosEditaveisCompromisso,
  StatusCompromisso,
  VisaoAgenda,
} from "./types"

const DIA_EM_MS = 86_400_000

function paraData(valor: string): Date {
  return new Date(`${valor}T12:00:00`)
}

function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10)
}

export function novoIdCompromisso(): string {
  return `cmp-${Math.random().toString(36).slice(2, 8)}`
}

export function criarCompromissoEmMemoria(
  compromissos: Compromisso[],
  compromisso: Compromisso,
): Compromisso[] {
  if (
    !compromisso.titulo.trim() ||
    !compromisso.data ||
    !compromisso.responsavel.trim()
  ) {
    throw new Error("O compromisso precisa de título, data e responsável.")
  }
  return [...compromissos, compromisso]
}

export function editarCompromissoEmMemoria(
  compromissos: Compromisso[],
  id: string,
  dados: DadosEditaveisCompromisso,
): Compromisso[] {
  if (!compromissos.some((compromisso) => compromisso.id === id)) {
    throw new Error("Compromisso não encontrado.")
  }
  if (!dados.titulo.trim() || !dados.data) {
    throw new Error("O compromisso precisa de título e data.")
  }
  return compromissos.map((compromisso) =>
    compromisso.id === id ? { ...compromisso, ...dados } : compromisso,
  )
}

export function mudarStatusCompromissoEmMemoria(
  compromissos: Compromisso[],
  id: string,
  status: StatusCompromisso,
): Compromisso[] {
  if (!compromissos.some((compromisso) => compromisso.id === id)) {
    throw new Error("Compromisso não encontrado.")
  }
  return compromissos.map((compromisso) =>
    compromisso.id === id ? { ...compromisso, status } : compromisso,
  )
}

export function compromissoDentroDaVisao(
  data: string,
  referencia: string,
  visao: VisaoAgenda,
): boolean {
  if (visao === "dia") return data === referencia
  if (visao === "mes") return data.slice(0, 7) === referencia.slice(0, 7)

  const diferenca =
    (paraData(data).getTime() - paraData(referencia).getTime()) / DIA_EM_MS
  return diferenca >= -3 && diferenca <= 7
}

export function compromissosDaVisao(
  compromissos: Compromisso[],
  referencia: string,
  visao: VisaoAgenda,
): Compromisso[] {
  return compromissos
    .filter((compromisso) =>
      compromissoDentroDaVisao(compromisso.data, referencia, visao),
    )
    .sort((a, b) =>
      `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`),
    )
}

export function navegarPeriodo(
  referencia: string,
  visao: VisaoAgenda,
  direcao: -1 | 1,
): string {
  const data = paraData(referencia)
  if (visao === "mes") {
    data.setMonth(data.getMonth() + direcao)
  } else {
    data.setDate(data.getDate() + direcao * (visao === "semana" ? 7 : 1))
  }
  return paraIso(data)
}

export function rotuloPeriodo(referencia: string, visao: VisaoAgenda): string {
  const formatador = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const referenciaData = paraData(referencia)

  if (visao === "dia") return formatador.format(referenciaData)
  if (visao === "mes") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(referenciaData)
  }

  const inicio = paraData(referencia)
  inicio.setDate(inicio.getDate() - 3)
  const fim = paraData(referencia)
  fim.setDate(fim.getDate() + 7)
  return `${formatador.format(inicio)} a ${formatador.format(fim)}`
}
