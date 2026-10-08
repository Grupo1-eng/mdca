// Recorte temporário dos dados mock de SistemaGestao usado exclusivamente pelo
// Dashboard. As telas e mutações dos demais domínios serão migradas em etapas
// próprias; autenticação nunca faz parte deste mock.

export interface IniciativaGestao {
  id: string
  nome: string
  tipo: "Projeto" | "Serviço" | "Programa"
  situacao: "Ativo" | "Encerrado" | "Suspenso"
}

export interface EducandoGestao {
  id: string
  nome: string
  iniciativaId: string
  situacaoVinculo: "Ativo" | "Inativo"
  cpf: string
  nis: string
}

export interface AtendimentoGestao {
  id: string
  educandoId: string
  profissional: string
  dataHora: string
}

export interface EncaminhamentoGestao {
  id: string
  educandoId: string
  dataHora: string
  destino: string
  acompanhamentos: {
    data: string
    situacao: "Pendente" | "Em andamento" | "Efetivado"
  }[]
}

export interface AtividadeGestao {
  id: string
  nome: string
  iniciativaId: string
}

export interface EncontroGestao {
  id: string
  atividadeId: string
  data: string
  horario: string
  local: string
  situacao: "Planejado" | "Realizado" | "Cancelado"
  presencas: { educandoId: string presente: boolean }[]
}

export interface CompromissoGestao {
  id: string
  titulo: string
  data: string
  horario: string
  local: string
  tipo: "Atendimento" | "Reunião" | "Visita domiciliar" | "Encontro de atividade"
  status: "Agendado" | "Realizado" | "Cancelado"
}

const hoje = new Date()
const iso = (offsetDias: number) => {
  const data = new Date(hoje)
  data.setDate(data.getDate() + offsetDias)
  return data.toISOString().slice(0, 10)
}

export const iniciativasGestao: IniciativaGestao[] = [
  {
    id: "ini-1",
    nome: "Convivência e Fortalecimento de Vínculos",
    tipo: "Serviço",
    situacao: "Ativo",
  },
  {
    id: "ini-2",
    nome: "Projeto Semear – Contraturno Escolar",
    tipo: "Projeto",
    situacao: "Ativo",
  },
  {
    id: "ini-3",
    nome: "Programa Jovem Aprendiz Cidadão",
    tipo: "Programa",
    situacao: "Ativo",
  },
  {
    id: "ini-4",
    nome: "Projeto Arte na Praça",
    tipo: "Projeto",
    situacao: "Encerrado",
  },
]

export const educandosGestao: EducandoGestao[] = [
  {
    id: "edu-1",
    nome: "Ana Beatriz Souza",
    iniciativaId: "ini-1",
    situacaoVinculo: "Ativo",
    cpf: "123.456.789-00",
    nis: "1234567890",
  },
  {
    id: "edu-2",
    nome: "Carlos Eduardo Lima",
    iniciativaId: "ini-2",
    situacaoVinculo: "Ativo",
    cpf: "987.654.321-00",
    nis: "9876543210",
  },
  {
    id: "edu-3",
    nome: "Juliana Ferreira",
    iniciativaId: "ini-3",
    situacaoVinculo: "Ativo",
    cpf: "111.222.333-44",
    nis: "1122334455",
  },
  {
    id: "edu-4",
    nome: "Miguel Antunes",
    iniciativaId: "ini-1",
    situacaoVinculo: "Inativo",
    cpf: "555.666.777-88",
    nis: "5566778899",
  },
  {
    id: "edu-5",
    nome: "Sofia Nogueira",
    iniciativaId: "ini-2",
    situacaoVinculo: "Ativo",
    cpf: "222.333.444-55",
    nis: "2233445566",
  },
]

export const atendimentosGestao: AtendimentoGestao[] = [
  {
    id: "at-1",
    educandoId: "edu-1",
    profissional: "Fernanda Rocha",
    dataHora: `${iso(-2)}T14:30`,
  },
  {
    id: "at-2",
    educandoId: "edu-1",
    profissional: "Rafael Dias",
    dataHora: `${iso(-9)}T10:00`,
  },
  {
    id: "at-3",
    educandoId: "edu-2",
    profissional: "Fernanda Rocha",
    dataHora: `${iso(-1)}T09:15`,
  },
  {
    id: "at-4",
    educandoId: "edu-3",
    profissional: "Rafael Dias",
    dataHora: `${iso(-4)}T16:00`,
  },
]

export const encaminhamentosGestao: EncaminhamentoGestao[] = [
  {
    id: "enc-1",
    educandoId: "edu-1",
    dataHora: `${iso(-9)}T11:00`,
    destino: "UBS Vila Nova – Saúde Mental",
    acompanhamentos: [{ data: iso(-3), situacao: "Em andamento" }],
  },
  {
    id: "enc-2",
    educandoId: "edu-2",
    dataHora: `${iso(-20)}T15:30`,
    destino: "CRAS Centro",
    acompanhamentos: [
      { data: iso(-16), situacao: "Em andamento" },
      { data: iso(-12), situacao: "Efetivado" },
    ],
  },
  {
    id: "enc-3",
    educandoId: "edu-3",
    dataHora: `${iso(-5)}T13:00`,
    destino: "Programa Jovem Aprendiz – empresa parceira",
    acompanhamentos: [],
  },
]

export const atividadesGestao: AtividadeGestao[] = [
  { id: "atv-1", nome: "Oficina de Música", iniciativaId: "ini-1" },
  { id: "atv-2", nome: "Reforço Escolar – Matemática", iniciativaId: "ini-2" },
  { id: "atv-3", nome: "Roda de Projeto de Vida", iniciativaId: "ini-3" },
]

export const encontrosGestao: EncontroGestao[] = [
  {
    id: "enco-1",
    atividadeId: "atv-1",
    data: iso(-3),
    horario: "14:00",
    local: "Sala de Oficinas",
    situacao: "Realizado",
    presencas: [
      { educandoId: "edu-1", presente: true },
      { educandoId: "edu-4", presente: false },
      { educandoId: "edu-5", presente: true },
    ],
  },
  {
    id: "enco-2",
    atividadeId: "atv-1",
    data: iso(-1),
    horario: "14:00",
    local: "Sala de Oficinas",
    situacao: "Realizado",
    presencas: [
      { educandoId: "edu-1", presente: true },
      { educandoId: "edu-5", presente: true },
    ],
  },
  {
    id: "enco-3",
    atividadeId: "atv-2",
    data: iso(-2),
    horario: "09:00",
    local: "Sala 2",
    situacao: "Realizado",
    presencas: [
      { educandoId: "edu-2", presente: true },
      { educandoId: "edu-5", presente: false },
    ],
  },
  {
    id: "enco-4",
    atividadeId: "atv-3",
    data: iso(2),
    horario: "18:30",
    local: "Auditório",
    situacao: "Planejado",
    presencas: [{ educandoId: "edu-3", presente: false }],
  },
]

export const compromissosGestao: CompromissoGestao[] = [
  {
    id: "cmp-1",
    titulo: "Atendimento individual – Ana Beatriz",
    data: iso(0),
    horario: "14:00",
    local: "Sala Técnica 1",
    tipo: "Atendimento",
    status: "Agendado",
  },
  {
    id: "cmp-2",
    titulo: "Reunião de equipe técnica",
    data: iso(0),
    horario: "16:30",
    local: "Sala de Reuniões",
    tipo: "Reunião",
    status: "Agendado",
  },
  {
    id: "cmp-3",
    titulo: "Visita domiciliar – família Antunes",
    data: iso(1),
    horario: "10:00",
    local: "Travessa Sol, 12",
    tipo: "Visita domiciliar",
    status: "Agendado",
  },
  {
    id: "cmp-4",
    titulo: "Roda de Projeto de Vida",
    data: iso(2),
    horario: "18:30",
    local: "Auditório",
    tipo: "Encontro de atividade",
    status: "Agendado",
  },
  {
    id: "cmp-5",
    titulo: "Atendimento – Carlos Eduardo",
    data: iso(-1),
    horario: "09:15",
    local: "Sala Técnica 2",
    tipo: "Atendimento",
    status: "Realizado",
  },
  {
    id: "cmp-6",
    titulo: "Oficina de Música (extra)",
    data: iso(-2),
    horario: "15:00",
    local: "Sala de Oficinas",
    tipo: "Encontro de atividade",
    status: "Cancelado",
  },
]

export function situacaoAtualEncaminhamento(
  encaminhamento: EncaminhamentoGestao,
) {
  return (
    [...encaminhamento.acompanhamentos]
      .sort((a, b) => a.data.localeCompare(b.data))
      .at(-1)?.situacao ?? "Pendente"
  )
}
