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
    // Administrativo: igual ao educador (lista e frequência, sem ficha). A
    // MDCA deixou o administrativo para a 2ª etapa (questionário, pergunta 34),
    // e GET /api/educandos não traz o cadastro para esse perfil.
    case "administrativo":
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
    coordenador_financeiro: "Coordenação financeira",
    gestor_financeiro: "Gestão financeira",
    analista_financeiro: "Análise financeira",
  }
  return nomes[perfil]
}

// Público atendido pela MDCA: 6 a 17 anos (questionário, pergunta 4). Vale
// só para o cadastro novo; quem já é educando e fez 18 anos segue editável.
// O backend confere a mesma regra no POST /api/educandos.
export const IDADE_MINIMA = 6
export const IDADE_MAXIMA = 17

// Idade completa em `hoje` para uma data "AAAA-MM-DD"; null se inválida.
export function idadeEm(nascimento: string, hoje: Date = new Date()): number | null {
  const [ano, mes, dia] = nascimento.split("-").map(Number)
  if (!ano || !mes || !dia) return null
  let idade = hoje.getFullYear() - ano
  const mesHoje = hoje.getMonth() + 1
  if (mesHoje < mes || (mesHoje === mes && hoje.getDate() < dia)) idade -= 1
  return idade
}

export function problemaFaixaEtaria(
  nascimento: string,
  hoje: Date = new Date(),
): string | null {
  const idade = idadeEm(nascimento, hoje)
  if (idade === null) return null
  if (idade < 0) return "A data de nascimento não pode ser no futuro."
  if (idade < IDADE_MINIMA || idade > IDADE_MAXIMA) {
    return `A MDCA atende crianças e adolescentes de ${IDADE_MINIMA} a ${IDADE_MAXIMA} anos. Pela data de nascimento, o educando tem ${idade} ano${idade === 1 ? "" : "s"}.`
  }
  return null
}

