// Regras de tela do painel de indicadores (US05, RF15): períodos rápidos,
// formatação e exportação em CSV e PDF (relatório para imprimir/salvar).
// Funções puras.
import type { PainelApi } from "../api/painel"
import type { Perfil } from "@/types/financeiro"

const dois = (n: number) => String(n).padStart(2, "0")
const iso = (d: Date) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`

export type PeriodoRapido = "mes-atual" | "mes-anterior" | "ano-atual"

export const PERIODOS_RAPIDOS: Array<{ id: PeriodoRapido; rotulo: string }> = [
  { id: "mes-atual", rotulo: "Este mês" },
  { id: "mes-anterior", rotulo: "Mês passado" },
  { id: "ano-atual", rotulo: "Este ano" },
]

// Prestação de contas é quase sempre mensal (questionário, pergunta 12).
export function periodoRapido(
  periodo: PeriodoRapido,
  hoje: Date = new Date(),
): { inicio: string; fim: string } {
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  if (periodo === "ano-atual") {
    return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` }
  }
  const base = periodo === "mes-atual" ? mes : mes - 1
  return {
    inicio: iso(new Date(ano, base, 1)),
    fim: iso(new Date(ano, base + 1, 0)),
  }
}

export function dataBr(valor: string): string {
  return valor.split("-").reverse().join("/")
}

export function percentual(valor: number | null): string {
  if (valor === null) return "—"
  return `${(valor * 100).toFixed(1).replace(".", ",")}%`
}

export function moeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const TIPOS: Record<string, string> = {
  PROJETO: "Projeto",
  SERVICO: "Serviço",
  PROGRAMA: "Programa",
}

export function tipoIniciativa(tipo: string): string {
  return TIPOS[tipo?.toUpperCase()] ?? tipo
}

// Quem exporta o painel em CSV/PDF (decisão do usuário, 26/11): coordenação e
// administrativo. Os demais perfis da Gestão veem o painel, sem exportar.
export const PERFIS_EXPORTAM_PAINEL: readonly Perfil[] = ["coordenador", "administrativo"]

export function podeExportarPainel(perfil: Perfil | undefined): boolean {
  return perfil !== undefined && PERFIS_EXPORTAM_PAINEL.includes(perfil)
}

export function comOrcamento(painel: PainelApi): boolean {
  return "orcamentoTotal" in painel.totais
}

export function descricaoFiltros(painel: PainelApi): string {
  const { inicio, fim, iniciativaId } = painel.filtros
  const iniciativa =
    iniciativaId === null
      ? "todas as iniciativas"
      : (painel.porIniciativa.find((l) => l.id === iniciativaId)?.nome ?? "iniciativa selecionada")
  return `${dataBr(inicio)} a ${dataBr(fim)} · ${iniciativa}`
}

// Linhas comuns ao CSV e ao relatório: indicadores e tabela por iniciativa.
function tabela(painel: PainelApi): { cabecalho: string[]; linhas: string[][] } {
  const orcamento = comOrcamento(painel)
  const cabecalho = [
    "Iniciativa",
    "Tipo",
    "Educandos atendidos",
    "Atendimentos registrados",
    "Encontros realizados",
    "Presenças",
    "Ausências",
    "Frequência média",
    ...(orcamento ? ["Orçamento total"] : []),
  ]
  const linha = (
    nome: string,
    tipo: string,
    l: PainelApi["totais"],
  ): string[] => [
    nome,
    tipo,
    String(l.educandosAtendidos),
    String(l.atendimentosRegistrados),
    String(l.encontrosRealizados),
    String(l.presencas),
    String(l.ausencias),
    percentual(l.frequenciaMedia),
    ...(orcamento ? [moeda(l.orcamentoTotal)] : []),
  ]
  return {
    cabecalho,
    linhas: [
      ...painel.porIniciativa.map((l) => linha(l.nome, tipoIniciativa(l.tipo), l)),
      linha("Total", "", painel.totais),
    ],
  }
}

function celulaCsv(valor: string): string {
  return /[";\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
}

// CSV com ";" e BOM, para abrir direto no Excel em português.
export function gerarCsvPainel(painel: PainelApi): string {
  const { cabecalho, linhas } = tabela(painel)
  const corpo = [
    ["Painel da Gestão — MDCA"],
    [`Período: ${dataBr(painel.filtros.inicio)} a ${dataBr(painel.filtros.fim)}`],
    [],
    cabecalho,
    ...linhas,
  ]
    .map((linha) => linha.map(celulaCsv).join(";"))
    .join("\r\n")
  return `﻿${corpo}\r\n`
}

function html(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Página própria para imprimir ou "Salvar como PDF" no navegador (sem
// biblioteca nova; a MDCA pediu custo zero).
export function gerarRelatorioHtml(painel: PainelApi, geradoEm: Date = new Date()): string {
  const { cabecalho, linhas } = tabela(painel)
  const t = painel.totais
  const destaques: Array<[string, string]> = [
    ["Educandos atendidos", String(t.educandosAtendidos)],
    ["Atendimentos registrados", String(t.atendimentosRegistrados)],
    ["Encontros realizados", String(t.encontrosRealizados)],
    ["Frequência média", percentual(t.frequenciaMedia)],
  ]
  const geradoTexto = `${dataBr(iso(geradoEm))} às ${dois(geradoEm.getHours())}:${dois(geradoEm.getMinutes())}`
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Painel da Gestão — ${html(descricaoFiltros(painel))}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: #444; font-size: 13px; }
  .destaques { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
  .destaques div { border: 1px solid #ccc; border-radius: 6px; padding: 10px; }
  .destaques span { display: block; font-size: 11px; color: #555; }
  .destaques strong { font-size: 20px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  td:nth-child(n+3), th:nth-child(n+3) { text-align: right; }
  tr:last-child td { font-weight: 600; background: #f3f3f3; }
  .nota { margin-top: 16px; font-size: 11px; color: #555; }
</style></head><body>
<h1>Painel da Gestão — MDCA</h1>
<p>${html(descricaoFiltros(painel))} · gerado em ${geradoTexto}</p>
<div class="destaques">${destaques
    .map(([rotulo, valor]) => `<div><span>${html(rotulo)}</span><strong>${html(valor)}</strong></div>`)
    .join("")}</div>
<table><thead><tr>${cabecalho.map((c) => `<th>${html(c)}</th>`).join("")}</tr></thead>
<tbody>${linhas
    .map((l) => `<tr>${l.map((c) => `<td>${html(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>
<p class="nota">Encontros realizados e atendimentos são contados à parte. A frequência média considera só encontros marcados como realizados. Um atendimento sem iniciativa própria conta para as iniciativas a que o educando está vinculado; por isso a soma das linhas pode passar do total.</p>
</body></html>`
}
