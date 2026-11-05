import type { Perfil } from "@/types/financeiro"
import type {
  Educando,
  Encaminhamento,
  Responsavel,
  StatusEncaminhamento,
} from "./types"

export const MOTIVOS_INGRESSO = [
  "Situação de isolamento",
  "Trabalho infantil",
  "Vivência de violência e/ou negligência",
  "Fora da escola ou com defasagem escolar superior a 2 anos",
  "Situação de acolhimento",
  "Cumprimento de medida socioeducativa em meio aberto, ou egresso",
  "Situação de abuso e/ou exploração sexual",
  "Medidas de proteção do ECA",
  "Criança/adolescente em situação de rua",
  "Vulnerabilidade relacionada a pessoas com deficiência",
  "Dificuldade de aprendizagem",
] as const

export const ORIGENS_ENCAMINHAMENTO = [
  "Ação Rua",
  "CREAS Leste",
  "CRAS Leste I/II",
  "CRAS Partenon",
  "SAF AELCA",
  "SAF Santa Rita",
  "Escola",
  "Conselho Tutelar",
  "Espontâneo",
  "Outro",
] as const

export const CORES_AUTODECLARADAS = [
  "Branca",
  "Preta",
  "Parda",
  "Amarela",
  "Indígena",
  "Não declarada",
] as const

export interface PermissoesEducandos {
  verFichaCompleta: boolean
  verCadastro: boolean
  editarCadastro: boolean
  verEvolucao: boolean
  verSaude: boolean
  inativarEducando: boolean
}

const semAcesso: PermissoesEducandos = {
  verFichaCompleta: false,
  verCadastro: false,
  editarCadastro: false,
  verEvolucao: false,
  verSaude: false,
  inativarEducando: false,
}

export function permissoesEducandos(
  perfil: Perfil | undefined,
): PermissoesEducandos {
  switch (perfil) {
    case "coordenador":
      return {
        verFichaCompleta: true,
        verCadastro: true,
        editarCadastro: true,
        verEvolucao: true,
        verSaude: true,
        inativarEducando: true,
      }
    case "tecnico_servico_social":
    case "tecnico_psicologia":
      return {
        ...semAcesso,
        verFichaCompleta: true,
        verCadastro: true,
        editarCadastro: true,
        verEvolucao: true,
        verSaude: true,
      }
    case "administrativo":
      return { ...semAcesso, verCadastro: true }
    default:
      return semAcesso
  }
}

export function novoId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 8)}`
}

export function responsavelVazio(id = novoId("resp")): Responsavel {
  return {
    id,
    nome: "",
    vinculo: "",
    cpf: "",
    rg: "",
    telefone: "",
    profissao: "",
    tipoTrabalho: "",
    localTrabalho: "",
    escolaridade: "",
  }
}

export function educandoVazio(): Educando {
  return {
    id: "",
    nome: "",
    nascimento: "",
    cpf: "",
    nis: "",
    rg: "",
    corAutodeclarada: "",
    genero: "",
    endereco: "",
    telefone: "",
    iniciativaId: "",
    dataIngresso: "",
    situacaoVinculo: "Ativo",
    escola: "",
    serie: "",
    turno: "",
    repetencia: "",
    responsaveis: [responsavelVazio()],
    rendaFamiliar: "",
    pessoasCasa: 1,
    beneficios: "",
    moradia: "",
    doencaCronica: "",
    medicamentoContinuo: "",
    saudeObs: "",
    motivosIngresso: [],
    origemEncaminhamento: "",
  }
}

export function normalizarDocumento(valor: string): string {
  return valor.replace(/\D/g, "")
}

// Máscara de CPF: só números, no máximo 11, no formato 000.000.000-00.
export function formatarCpf(valor: string): string {
  const d = normalizarDocumento(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// CPF vazio é permitido; preenchido, precisa ter os 11 dígitos.
export function cpfIncompleto(valor: string): boolean {
  const d = normalizarDocumento(valor)
  return d.length > 0 && d.length !== 11
}

export interface DuplicidadeDocumento {
  campo: "cpf" | "nis"
  educando: Educando
}

export function duplicidadeDe(
  educandos: Educando[],
  dados: Pick<Educando, "id" | "cpf" | "nis">,
): DuplicidadeDocumento | undefined {
  const cpf = normalizarDocumento(dados.cpf)
  const nis = normalizarDocumento(dados.nis)

  for (const educando of educandos) {
    if (educando.id === dados.id) continue

    if (cpf && normalizarDocumento(educando.cpf) === cpf) {
      return { campo: "cpf", educando }
    }
    if (nis && normalizarDocumento(educando.nis) === nis) {
      return { campo: "nis", educando }
    }
  }

  return undefined
}

export function duplicataDe(
  educandos: Educando[],
  dados: Pick<Educando, "id" | "cpf" | "nis">,
): Educando | undefined {
  return duplicidadeDe(educandos, dados)?.educando
}

export function salvarEducandoEmMemoria(
  educandos: Educando[],
  registro: Educando,
): Educando[] {
  const duplicidade = duplicidadeDe(educandos, registro)
  if (duplicidade) {
    const documento = duplicidade.campo.toUpperCase()
    throw new Error(
      `Este ${documento} já pertence a ${duplicidade.educando.nome}.`,
    )
  }
  return educandos.some((educando) => educando.id === registro.id)
    ? educandos.map((educando) =>
        educando.id === registro.id ? registro : educando,
      )
    : [...educandos, registro]
}

export function alternarSituacaoEmMemoria(
  educandos: Educando[],
  id: string,
): Educando[] {
  return educandos.map((educando) =>
    educando.id === id
      ? {
          ...educando,
          situacaoVinculo:
            educando.situacaoVinculo === "Ativo" ? "Inativo" : "Ativo",
        }
      : educando,
  )
}

export function filtrarEducandos(
  educandos: Educando[],
  busca: string,
  iniciativaId: string,
  situacao: string,
): Educando[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR")
  return educandos.filter(
    (educando) =>
      educando.nome.toLocaleLowerCase("pt-BR").includes(termo) &&
      (iniciativaId === "todas" || educando.iniciativaId === iniciativaId) &&
      (situacao === "todas" || educando.situacaoVinculo === situacao),
  )
}

export function situacaoAtualEncaminhamento(
  encaminhamento: Encaminhamento,
): StatusEncaminhamento {
  const ultimo = [...encaminhamento.acompanhamentos]
    .sort((a, b) => a.data.localeCompare(b.data))
    .at(-1)
  return ultimo?.situacao ?? encaminhamento.situacao ?? "Pendente"
}

export function nomePerfil(perfil: Perfil): string {
  const nomes: Record<Perfil, string> = {
    coordenador: "Coordenação",
    tecnico_servico_social: "Técnico – Serviço Social",
    tecnico_psicologia: "Técnico – Psicologia",
    educador: "Educador",
    administrativo: "Administrativo",
  }
  return nomes[perfil]
}
