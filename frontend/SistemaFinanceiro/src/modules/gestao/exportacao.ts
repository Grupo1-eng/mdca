// Exportação de relatórios da Gestão (prestação de contas): quem exporta e
// utilitários de CSV/download usados pelo painel e pela lista de presença.
import type { Perfil } from "@/types/financeiro"

// Decisão do usuário (26/11): coordenação e administrativo exportam. O
// backend aplica a mesma lista na lista de presença
// (PERFIS_EXPORTAM_RELATORIOS em backend/src/modules/gestao/perfis-gestao.ts).
export const PERFIS_EXPORTAM_RELATORIOS: readonly Perfil[] = ["coordenador", "administrativo"]

export function podeExportarRelatorios(perfil: Perfil | undefined): boolean {
  return perfil !== undefined && PERFIS_EXPORTAM_RELATORIOS.includes(perfil)
}

function celulaCsv(valor: string): string {
  return /[";\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
}

// CSV com ";" e BOM, para abrir direto no Excel em português.
export function linhasParaCsv(linhas: string[][]): string {
  const corpo = linhas.map((linha) => linha.map(celulaCsv).join(";")).join("\r\n")
  return `﻿${corpo}\r\n`
}

export function baixarArquivo(conteudo: string, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = document.createElement("a")
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}
