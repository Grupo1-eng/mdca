// Indicadores do Dashboard da Gestão calculados com os dados que já vêm da
// API (educandos e agenda). Funções puras.
import type { Compromisso } from "../agenda/types"
import type { Educando } from "../educandos/types"

const dois = (n: number) => String(n).padStart(2, "0")

// "AAAA-MM-DD" no fuso do navegador (toISOString usaria UTC e viraria o dia
// às 21h no horário de Brasília).
export function hojeLocal(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`
}

export function educandosAtivos(educandos: Educando[]): number {
  return educandos.filter((item) => item.situacaoVinculo === "Ativo").length
}

// Ativos sem CPF ou sem NIS.
export function cadastrosSemDocumento(educandos: Educando[]): number {
  return educandos.filter(
    (item) =>
      item.situacaoVinculo === "Ativo" && (!item.cpf.trim() || !item.nis.trim()),
  ).length
}

function agendadosAPartirDe(compromissos: Compromisso[], hoje: string) {
  return compromissos.filter(
    (item) => item.status === "Agendado" && item.data >= hoje,
  )
}

export function compromissosAgendados(
  compromissos: Compromisso[],
  hoje: string,
): number {
  return agendadosAPartirDe(compromissos, hoje).length
}

export function proximosCompromissos(
  compromissos: Compromisso[],
  hoje: string,
  limite = 3,
): Compromisso[] {
  return agendadosAPartirDe(compromissos, hoje)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, limite)
}
