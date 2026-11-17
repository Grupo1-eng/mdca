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
  // Id do vínculo principal no servidor (educando do banco com iniciativa).
  vinculoId?: string
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
  // Situação atual guardada no servidor; usada quando não há acompanhamentos.
  situacao?: StatusEncaminhamento
  acompanhamentos: AcompanhamentoEncaminhamento[]
}

export type SituacaoAtividade = "Ativa" | "Encerrada"

// Atividade de uma iniciativa (GET /api/atividades). O responsável é um
// usuário da organização (coordenação ou educador).
export interface Atividade {
  id: string
  nome: string
  iniciativaId: string
  iniciativaNome: string
  responsavelId: string
  responsavelNome: string
  situacao: SituacaoAtividade
  descricao: string
  encontrosTotal: number
  // Cancelado não conta como realizado (RN05).
  encontrosRealizados: number
}

export interface ResponsavelAtividade {
  id: string
  nome: string
}

export type SituacaoEncontro = "Planejado" | "Realizado" | "Cancelado"

// Encontro de uma atividade (GET /api/encontros). Data só como dia
// (AAAA-MM-DD) e horários como texto HH:MM.
export interface Encontro {
  id: string
  atividadeId: string
  data: string
  horaInicio: string
  horaFim: string
  local: string
  observacoes: string
  situacao: SituacaoEncontro
  presencasRegistradas: number
}

// Uma linha da chamada de um encontro (GET /api/frequencias/encontro/:id).
// `presente` null = ainda sem registro.
export interface LinhaChamada {
  educandoId: string
  nome: string
  presente: boolean | null
  observacao: string
  desvinculado: boolean
}

export interface Chamada {
  aceitaChamada: boolean
  linhas: LinhaChamada[]
}

// Histórico de frequência do educando (GET /api/frequencias/educando/:id).
export interface RegistroFrequencia {
  encontroId: string
  data: string
  horaInicio: string
  situacaoEncontro: SituacaoEncontro
  atividadeNome: string
  iniciativaNome: string
  presente: boolean
  observacao: string
}
