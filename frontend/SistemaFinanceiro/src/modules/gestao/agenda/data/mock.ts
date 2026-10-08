import type { Compromisso } from "../types"

export function dataRelativa(offsetDias: number): string {
  const data = new Date()
  data.setHours(12, 0, 0, 0)
  data.setDate(data.getDate() + offsetDias)
  return data.toISOString().slice(0, 10)
}

export const compromissosSeed: Compromisso[] = [
  {
    id: "cmp-1",
    titulo: "Atendimento individual – Ana Beatriz",
    data: dataRelativa(0),
    horario: "14:00",
    local: "Sala Técnica 1",
    responsavel: "Fernanda Rocha",
    tipo: "Atendimento",
    status: "Agendado",
    observacoes: "Retorno sobre frequência escolar.",
  },
  {
    id: "cmp-2",
    titulo: "Reunião de equipe técnica",
    data: dataRelativa(0),
    horario: "16:30",
    local: "Sala de Reuniões",
    responsavel: "Coordenação",
    tipo: "Reunião",
    status: "Agendado",
    observacoes: "Pauta: casos em acompanhamento.",
  },
  {
    id: "cmp-3",
    titulo: "Visita domiciliar – família Antunes",
    data: dataRelativa(1),
    horario: "10:00",
    local: "Travessa Sol, 12",
    responsavel: "Fernanda Rocha",
    tipo: "Visita domiciliar",
    status: "Agendado",
    observacoes: "",
  },
  {
    id: "cmp-4",
    titulo: "Roda de Projeto de Vida",
    data: dataRelativa(2),
    horario: "18:30",
    local: "Auditório",
    responsavel: "Rafael Dias",
    tipo: "Encontro de atividade",
    status: "Agendado",
    observacoes: "",
  },
  {
    id: "cmp-5",
    titulo: "Atendimento – Carlos Eduardo",
    data: dataRelativa(-1),
    horario: "09:15",
    local: "Sala Técnica 2",
    responsavel: "Fernanda Rocha",
    tipo: "Atendimento",
    status: "Realizado",
    observacoes: "",
  },
  {
    id: "cmp-6",
    titulo: "Oficina de Música (extra)",
    data: dataRelativa(-2),
    horario: "15:00",
    local: "Sala de Oficinas",
    responsavel: "Marcos Reis",
    tipo: "Encontro de atividade",
    status: "Cancelado",
    observacoes: "Cancelado por falta de energia elétrica na sede.",
  },
]
