// Conversão entre a tela (rótulos em português, datas AAAA-MM-DD, dinheiro
// com vírgula) e o contrato de /api/iniciativas (tipo em maiúsculas, dinheiro
// com ponto). Funções puras.
import { paraInputData } from "@/lib/format"
import type { ProjetoApi, ProjetoPayload, TipoProjetoApi } from "./projetos"
import { TIPOS_PROJETO } from "./projetos"

export const STATUS_INICIATIVA = ["Planejamento", "Em andamento", "Concluído"] as const

const ROTULO_TIPO: Record<TipoProjetoApi, string> = {
  PROJETO: "Projeto",
  SERVICO: "Serviço",
  PROGRAMA: "Programa",
}

export interface IniciativaTela {
  id: string
  nome: string
  descricao: string
  tipo: TipoProjetoApi
  status: string
  orcamento: string
  dataInicio: string
  dataFim: string
}

export function tipoParaTela(tipo: string): string {
  if ((TIPOS_PROJETO as readonly string[]).includes(tipo)) {
    return ROTULO_TIPO[tipo as TipoProjetoApi]
  }
  return tipo
}

export function tipoParaApi(valor: string): TipoProjetoApi {
  const limpo = valor.trim().toLowerCase()
  if (limpo === "projeto" || limpo === "PROJETO".toLowerCase()) return "PROJETO"
  if (limpo === "serviço" || limpo === "servico") return "SERVICO"
  if (limpo === "programa") return "PROGRAMA"
  if ((TIPOS_PROJETO as readonly string[]).includes(valor)) return valor as TipoProjetoApi
  throw new Error("Tipo de iniciativa inválido.")
}

export function orcamentoParaTela(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return ""
  const texto = String(valor).trim()
  if (!texto) return ""
  const numero = Number(texto)
  if (!Number.isFinite(numero)) return texto
  return numero.toFixed(2).replace(".", ",")
}

export function orcamentoParaApi(valor: string): string | null {
  const limpo = valor.replace(/R\$|\s/g, "")
  if (!limpo) return null
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(normalizado)) {
    throw new Error(
      "Orçamento inválido. Use um valor positivo com até 2 casas, por exemplo 1500,00.",
    )
  }
  return normalizado
}

export function deProjetoApi(api: ProjetoApi): IniciativaTela {
  return {
    id: String(api.id),
    nome: api.nome,
    descricao: api.descricao ?? "",
    tipo: tipoParaApi(api.tipo),
    status: api.status,
    orcamento: orcamentoParaTela(api.orcamentoTotal),
    // Mesma leitura do Financeiro: a data gravada é a parte AAAA-MM-DD,
    // sem converter o fuso (meia-noite UTC não pode voltar um dia).
    dataInicio: paraInputData(api.dataInicio),
    dataFim: paraInputData(api.dataFim),
  }
}

export function paraProjetoPayload(iniciativa: IniciativaTela): ProjetoPayload {
  const nome = iniciativa.nome.trim()
  if (!nome) throw new Error("Informe o nome da iniciativa.")
  const status = iniciativa.status.trim()
  if (!status) throw new Error("Informe a situação da iniciativa.")
  return {
    nome,
    descricao: iniciativa.descricao.trim() || null,
    tipo: tipoParaApi(iniciativa.tipo),
    status,
    orcamentoTotal: orcamentoParaApi(iniciativa.orcamento),
    dataInicio: iniciativa.dataInicio || null,
    dataFim: iniciativa.dataFim || null,
  }
}
