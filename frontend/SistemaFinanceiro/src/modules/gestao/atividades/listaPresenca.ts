// Lista de presença de uma atividade num período, em CSV, para prestação de
// contas aos parceiros (questionário da MDCA, perguntas 12, 13 e 21).
// Funções puras.
import type { ListaPresencaApi } from "../api/atividades"
import { linhasParaCsv } from "../exportacao"

const dataBr = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/")

function cabecalhoEncontro(encontro: ListaPresencaApi["encontros"][number]): string {
  const dia = encontro.dataInicio ? dataBr(encontro.dataInicio) : "Sem data"
  const hora = encontro.horaInicio ? ` ${encontro.horaInicio}` : ""
  const planejado = encontro.situacao === "agendado" ? " (planejado)" : ""
  return `${dia}${hora}${planejado}`
}

function frequencia(presencas: number, ausencias: number): string {
  const total = presencas + ausencias
  if (total === 0) return "—"
  return `${((presencas / total) * 100).toFixed(1).replace(".", ",")}%`
}

export function gerarCsvListaPresenca(lista: ListaPresencaApi): string {
  const cabecalho = [
    "Educando",
    ...lista.encontros.map(cabecalhoEncontro),
    "Presenças",
    "Faltas",
    "Frequência",
  ]
  const linhas = lista.linhas.map((linha) => [
    linha.nome,
    ...lista.encontros.map((encontro) => {
      const presente = linha.presencas[encontro.id]
      return presente === undefined ? "" : presente ? "P" : "F"
    }),
    String(linha.totalPresencas),
    String(linha.totalAusencias),
    frequencia(linha.totalPresencas, linha.totalAusencias),
  ])
  return linhasParaCsv([
    ["Lista de presença — MDCA"],
    [`Atividade: ${lista.atividade.nome}`],
    [`Iniciativa: ${lista.atividade.iniciativa.nome}`],
    [`Período: ${dataBr(lista.periodo.inicio)} a ${dataBr(lista.periodo.fim)}`],
    ["P = presente; F = falta; em branco = sem registro de chamada"],
    [],
    cabecalho,
    ...linhas,
  ])
}

export function nomeArquivoLista(lista: ListaPresencaApi): string {
  const slug = lista.atividade.nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `lista-presenca-${slug || "atividade"}-${lista.periodo.inicio}-a-${lista.periodo.fim}.csv`
}
