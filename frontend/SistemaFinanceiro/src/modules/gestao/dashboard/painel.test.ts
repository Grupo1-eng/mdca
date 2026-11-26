import { describe, expect, it } from "vitest"
import type { PainelApi } from "../api/painel"
import {
  comOrcamento,
  descricaoFiltros,
  gerarCsvPainel,
  gerarRelatorioHtml,
  moeda,
  percentual,
  periodoRapido,
  podeExportarPainel,
} from "./painel"

const painel = (orcamento: boolean): PainelApi => {
  const base = {
    educandosAtendidos: 4,
    atendimentosRegistrados: 3,
    encontrosRealizados: 3,
    presencas: 3,
    ausencias: 2,
    frequenciaMedia: 0.6,
  }
  return {
    filtros: { inicio: "2026-11-01", fim: "2026-11-30", iniciativaId: null },
    totais: { ...base, ...(orcamento ? { orcamentoTotal: 1500.5 } : {}) },
    porIniciativa: [
      {
        id: 1,
        nome: 'Oficina "Arte"; música',
        tipo: "PROJETO",
        ...base,
        frequenciaMedia: null,
        ...(orcamento ? { orcamentoTotal: 1500.5 } : {}),
      },
    ],
  }
}

describe("períodos rápidos", () => {
  const hoje = new Date(2026, 0, 15) // 15/01/2026

  it("este mês, mês passado (virando o ano) e este ano", () => {
    expect(periodoRapido("mes-atual", hoje)).toEqual({ inicio: "2026-01-01", fim: "2026-01-31" })
    expect(periodoRapido("mes-anterior", hoje)).toEqual({ inicio: "2025-12-01", fim: "2025-12-31" })
    expect(periodoRapido("ano-atual", hoje)).toEqual({ inicio: "2026-01-01", fim: "2026-12-31" })
  })

  it("fevereiro termina no dia certo", () => {
    expect(periodoRapido("mes-atual", new Date(2028, 1, 10)).fim).toBe("2028-02-29")
  })
})

describe("formatação", () => {
  it("percentual com vírgula, e traço sem chamada", () => {
    expect(percentual(0.6)).toBe("60,0%")
    expect(percentual(2 / 3)).toBe("66,7%")
    expect(percentual(null)).toBe("—")
  })

  it("moeda em reais, e traço sem orçamento", () => {
    expect(moeda(1500.5)).toMatch(/R\$\s?1\.500,50/)
    expect(moeda(null)).toBe("—")
  })

  it("descreve os filtros para o relatório", () => {
    expect(descricaoFiltros(painel(false))).toBe("01/11/2026 a 30/11/2026 · todas as iniciativas")
  })
})

describe("exportação CSV", () => {
  it("usa ; e BOM, traz o período, as linhas e o total", () => {
    const csv = gerarCsvPainel(painel(false))
    expect(csv.startsWith("﻿")).toBe(true)
    const linhas = csv.trim().split("\r\n")
    expect(linhas[1]).toBe("Período: 01/11/2026 a 30/11/2026")
    expect(linhas[3]).toBe(
      "Iniciativa;Tipo;Educandos atendidos;Atendimentos registrados;Encontros realizados;Presenças;Ausências;Frequência média",
    )
    // Nome com aspas e ponto e vírgula vai entre aspas, com aspas dobradas.
    expect(linhas[4]).toBe('"Oficina ""Arte""; música";Projeto;4;3;3;3;2;—')
    expect(linhas[5]).toBe("Total;;4;3;3;3;2;60,0%")
  })

  it("coluna de orçamento só quando o backend manda (coordenação)", () => {
    expect(comOrcamento(painel(false))).toBe(false)
    expect(gerarCsvPainel(painel(false))).not.toContain("Orçamento")
    expect(comOrcamento(painel(true))).toBe(true)
    expect(gerarCsvPainel(painel(true))).toContain("Orçamento total")
  })
})

describe("relatório para PDF", () => {
  it("traz título, filtros, destaques e escapa o HTML dos nomes", () => {
    const html = gerarRelatorioHtml(painel(false), new Date(2026, 10, 24, 9, 5))
    expect(html).toContain("<h1>Painel da Gestão — MDCA</h1>")
    expect(html).toContain("01/11/2026 a 30/11/2026 · todas as iniciativas · gerado em 24/11/2026 às 09:05")
    expect(html).toContain("<span>Frequência média</span><strong>60,0%</strong>")
    expect(html).toContain("Oficina &quot;Arte&quot;; música")
    expect(html).not.toContain('Oficina "Arte"')
  })
})

describe("podeExportarPainel", () => {
  it("libera só coordenação e administrativo", () => {
    expect(podeExportarPainel("coordenador")).toBe(true)
    expect(podeExportarPainel("administrativo")).toBe(true)
    expect(podeExportarPainel("tecnico_servico_social")).toBe(false)
    expect(podeExportarPainel("tecnico_psicologia")).toBe(false)
    expect(podeExportarPainel("educador")).toBe(false)
    expect(podeExportarPainel(undefined)).toBe(false)
  })
})
