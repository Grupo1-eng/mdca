import type {
  Compromisso,
  DadosEditaveisCompromisso,
  StatusCompromisso,
  VisaoAgenda,
} from "./types"

function paraData(valor: string): Date {
  return new Date(`${valor}T12:00:00`)
}

function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10)
}

// Segunda-feira da semana da data (semana de segunda a domingo).
export function inicioDaSemana(valor: string): string {
  const data = paraData(valor)
  const diasDesdeSegunda = (data.getDay() + 6) % 7
  data.setDate(data.getDate() - diasDesdeSegunda)
  return paraIso(data)
}

export function fimDaSemana(valor: string): string {
  const data = paraData(inicioDaSemana(valor))
  data.setDate(data.getDate() + 6)
  return paraIso(data)
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

  // Datas "AAAA-MM-DD" comparam em ordem cronológica como texto.
  return data >= inicioDaSemana(referencia) && data <= fimDaSemana(referencia)
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

  const inicio = paraData(inicioDaSemana(referencia))
  const fim = paraData(fimDaSemana(referencia))
  return `${formatador.format(inicio)} a ${formatador.format(fim)}`
}
