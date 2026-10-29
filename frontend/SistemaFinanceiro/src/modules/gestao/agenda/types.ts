export type TipoCompromisso = "Atendimento" | "Reunião" | "Visita domiciliar" | "Encontro de atividade"

export type StatusCompromisso = "Agendado" | "Realizado" | "Cancelado"
export type VisaoAgenda = "dia" | "semana" | "mes"

export interface Compromisso {
  id: string
  titulo: string
  data: string
  horario: string
  local: string
  responsavel: string
  tipo: TipoCompromisso
  status: StatusCompromisso
  observacoes: string
}

export type DadosEditaveisCompromisso = Pick<Compromisso, "titulo" | "data" | "horario" | "observacoes" | "local" | "tipo">
