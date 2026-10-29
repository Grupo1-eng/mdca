// Conversão entre o formato das telas (types.ts, IDs em texto) e o do backend
// (IDs numéricos, datas ISO, situação em minúsculas). Funções puras.
import type { Educando, Responsavel } from "../educandos/types"
import type {
  EducandoApi,
  EducandoPayload,
  ResponsavelApi,
  ResponsavelPayload,
} from "./educandos"

// Enquanto a migration 20261029180000_gestao_sprint3_campos não estiver no
// banco, o backend descarta estes campos. A tela os mostra desabilitados.
// Trocar para false quando a migration e os DTOs entrarem.
export const CAMPOS_AGUARDANDO_MIGRACAO = true

// Campos do formulário que ainda não são gravados no servidor.
export const CAMPOS_EDUCANDO_PENDENTES = [
  "genero",
  "serie",
  "motivosIngresso",
  "origemEncaminhamento",
  // Vínculo com a iniciativa: depende do endpoint de EducandoProjeto.
  "iniciativaId",
  "dataIngresso",
] as const

export function ehIdPersistido(id: string): boolean {
  return /^\d+$/.test(id)
}

function texto(valor: string | null | undefined): string {
  return valor ?? ""
}

function vazioParaNull(valor: string): string | null {
  const limpo = valor.trim()
  return limpo ? limpo : null
}

export function rendaParaTela(valor: string | number | null): string {
  if (valor === null || valor === undefined || valor === "") return ""
  return String(valor).replace(".", ",")
}

// Aceita "1500", "1500,50", "1.500,50" e "R$ 1.500,50".
export function rendaParaApi(valor: string): number | null {
  const limpo = valor.replace(/R\$|\s/g, "")
  if (!limpo) return null
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo
  const numero = Number(normalizado)
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(
      "Renda familiar inválida. Use apenas números, por exemplo 1500,00.",
    )
  }
  return numero
}

export function deResponsavelApi(api: ResponsavelApi): Responsavel {
  return {
    id: String(api.id),
    nome: api.nome,
    vinculo: api.vinculo,
    cpf: texto(api.cpf),
    rg: texto(api.rg),
    telefone: texto(api.telefone),
    profissao: texto(api.profissao),
    tipoTrabalho: texto(api.tipoTrabalho),
    localTrabalho: texto(api.localTrabalho),
    escolaridade: texto(api.escolaridade),
  }
}

export function deEducandoApi(api: EducandoApi): Educando {
  return {
    id: String(api.id),
    nome: api.nome,
    nascimento: api.dataNascimento ? api.dataNascimento.slice(0, 10) : "",
    cpf: texto(api.cpf),
    nis: texto(api.nis),
    rg: texto(api.rg),
    corAutodeclarada: texto(api.corAutodeclarada),
    genero: texto(api.genero),
    endereco: texto(api.endereco),
    telefone: texto(api.telefone),
    iniciativaId: "",
    dataIngresso: "",
    situacaoVinculo: api.situacaoAtual === "inativo" ? "Inativo" : "Ativo",
    escola: texto(api.escola),
    serie: texto(api.serie),
    turno: texto(api.turno),
    repetencia: texto(api.historicoRepetencia),
    responsaveis: (api.responsaveis ?? []).map(deResponsavelApi),
    rendaFamiliar: rendaParaTela(api.rendaFamiliar),
    pessoasCasa: api.numerosPessoasFamilias ?? 0,
    beneficios: texto(api.beneficiosSociais),
    moradia: texto(api.tipoMoradia),
    doencaCronica: texto(api.doencaCronica),
    medicamentoContinuo: texto(api.medicamentoContinuo),
    saudeObs: texto(api.observacaoSaude),
    motivosIngresso: api.motivosIngresso ?? [],
    origemEncaminhamento: texto(api.origemEncaminhamento),
  }
}

// Lança Error com mensagem para o usuário quando algum valor é inválido.
export function paraEducandoPayload(educando: Educando): EducandoPayload {
  const nome = educando.nome.trim()
  if (!nome) throw new Error("Informe o nome do educando.")

  const payload: EducandoPayload = {
    nome,
    cpf: vazioParaNull(educando.cpf),
    rg: vazioParaNull(educando.rg),
    nis: vazioParaNull(educando.nis),
    corAutodeclarada: vazioParaNull(educando.corAutodeclarada),
    dataNascimento: educando.nascimento || null,
    endereco: vazioParaNull(educando.endereco),
    telefone: vazioParaNull(educando.telefone),
    escola: vazioParaNull(educando.escola),
    turno: vazioParaNull(educando.turno),
    historicoRepetencia: vazioParaNull(educando.repetencia),
    numerosPessoasFamilias:
      educando.pessoasCasa > 0 ? Math.trunc(educando.pessoasCasa) : null,
    rendaFamiliar: rendaParaApi(educando.rendaFamiliar),
    beneficiosSociais: vazioParaNull(educando.beneficios),
    tipoMoradia: vazioParaNull(educando.moradia),
    doencaCronica: vazioParaNull(educando.doencaCronica),
    medicamentoContinuo: vazioParaNull(educando.medicamentoContinuo),
    observacaoSaude: vazioParaNull(educando.saudeObs),
  }

  if (!CAMPOS_AGUARDANDO_MIGRACAO) {
    payload.genero = vazioParaNull(educando.genero)
    payload.serie = vazioParaNull(educando.serie)
    payload.origemEncaminhamento = vazioParaNull(educando.origemEncaminhamento)
    payload.motivosIngresso = educando.motivosIngresso
  }

  return payload
}

function responsavelVazio(responsavel: Responsavel): boolean {
  return Object.entries(responsavel).every(
    ([campo, valor]) => campo === "id" || !valor.trim(),
  )
}

export interface ResponsavelParaSalvar {
  // undefined quando ainda não existe no servidor.
  id?: number
  dados: Omit<ResponsavelPayload, "educandoId">
}

// Ignora blocos novos totalmente em branco. O backend exige nome e vínculo.
export function responsaveisParaSalvar(
  responsaveis: Responsavel[],
): ResponsavelParaSalvar[] {
  return responsaveis
    .filter(
      (responsavel) =>
        ehIdPersistido(responsavel.id) || !responsavelVazio(responsavel),
    )
    .map((responsavel) => {
      if (!responsavel.nome.trim() || !responsavel.vinculo.trim()) {
        throw new Error(
          "Informe nome e vínculo de cada responsável familiar.",
        )
      }
      return {
        id: ehIdPersistido(responsavel.id) ? Number(responsavel.id) : undefined,
        dados: {
          nome: responsavel.nome.trim(),
          vinculo: responsavel.vinculo.trim(),
          cpf: vazioParaNull(responsavel.cpf),
          rg: vazioParaNull(responsavel.rg),
          telefone: vazioParaNull(responsavel.telefone),
          profissao: vazioParaNull(responsavel.profissao),
          tipoTrabalho: vazioParaNull(responsavel.tipoTrabalho),
          localTrabalho: vazioParaNull(responsavel.localTrabalho),
          escolaridade: vazioParaNull(responsavel.escolaridade),
        },
      }
    })
}
