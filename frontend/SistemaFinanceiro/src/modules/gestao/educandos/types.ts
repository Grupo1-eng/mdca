export type SituacaoVinculo = "Ativo" | "Inativo"

export interface Iniciativa {
  id: string
  codigo: string
  nome: string
  tipo: "Projeto" | "Serviço" | "Programa"
  situacao: "Ativo" | "Encerrado" | "Suspenso"
}

export interface Responsavel {
  id: string
  nome: string
  vinculo: string
  cpf: string
  rg: string
  telefone: string
  profissao: string
  tipoTrabalho: string
  localTrabalho: string
  escolaridade: string
}

export interface Educando {
  id: string
  nome: string
  nascimento: string
  cpf: string
  nis: string
  rg: string
  corAutodeclarada: string
  genero: string
  endereco: string
  telefone: string
  iniciativaId: string
  dataIngresso: string
  situacaoVinculo: SituacaoVinculo
  escola: string
  serie: string
  turno: string
  repetencia: string
  responsaveis: Responsavel[]
  rendaFamiliar: string
  pessoasCasa: number
  beneficios: string
  moradia: string
  doencaCronica: string
  medicamentoContinuo: string
  saudeObs: string
  motivosIngresso: string[]
  origemEncaminhamento: string
}

export interface Atendimento {
  id: string
  educandoId: string
  profissional: string
  perfilProfissional: string
  dataHora: string
  registro: string
  intervencaoUsuario: string
  intervencaoFamilia: string
  sigiloso: boolean
}

export type StatusEncaminhamento = "Pendente" | "Em andamento" | "Efetivado"

export interface AcompanhamentoEncaminhamento {
  id: string
  data: string
  situacao: StatusEncaminhamento
  observacao: string
}

export interface Encaminhamento {
  id: string
  educandoId: string
  profissional: string
  dataHora: string
  destino: string
  motivo: string
  acompanhamentos: AcompanhamentoEncaminhamento[]
}

export interface Atividade {
  id: string
  nome: string
  iniciativaId: string
}

export interface Encontro {
  id: string
  atividadeId: string
  data: string
  horario: string
  local: string
  situacao: "Planejado" | "Realizado" | "Cancelado"
  presencas: Array<{
    educandoId: string
    presente: boolean
    observacao?: string
  }>
}
