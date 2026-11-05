import { describe, expect, it } from "vitest";
import { nomeArquivo, planilhaComCabecalho } from "./planilha";

describe("planilhaComCabecalho", () => {
  const linhas = planilhaComCabecalho({
    titulo: "Fluxo de Caixa",
    filtros: ["Período: 01/09/2026 a 30/09/2026"],
    usuario: "Maria",
    geradoEm: new Date(2026, 10, 5, 9, 7),
    colunas: ["Período", "Entradas"],
    linhas: [["set/26", 150.5]],
    totais: ["Total", 150.5],
  });

  // RF59: o cabeçalho identifica filtros, data/hora e quem emitiu.
  it("abre com título, filtros, data/hora e usuário", () => {
    expect(linhas[0][0]).toMatchObject({ value: "Fluxo de Caixa", fontWeight: "bold" });
    expect(linhas[1][0]).toMatchObject({ value: "Período: 01/09/2026 a 30/09/2026" });
    expect(linhas[2][0]).toMatchObject({ value: "Gerado em 05/11/2026 09:07 por Maria" });
    expect(linhas[3]).toEqual([]);
  });

  it("escreve o cabeçalho da tabela em negrito e os valores em dinheiro como número", () => {
    expect(linhas[4]).toEqual([
      { value: "Período", fontWeight: "bold" },
      { value: "Entradas", fontWeight: "bold" },
    ]);
    expect(linhas[5]).toEqual([
      { value: "set/26", type: String },
      { value: 150.5, type: Number, format: "#,##0.00" },
    ]);
  });

  it("termina com a linha de totais em negrito", () => {
    expect(linhas[6]).toEqual([
      { value: "Total", type: String, fontWeight: "bold" },
      { value: 150.5, type: Number, format: "#,##0.00", fontWeight: "bold" },
    ]);
  });

  it("deixa células vazias como null", () => {
    // Sem filtros: título, emissão, linha em branco, cabeçalho e a linha de dados.
    const [, , , , linha] = planilhaComCabecalho({
      titulo: "t", filtros: [], usuario: null, geradoEm: new Date(2026, 0, 1),
      colunas: ["a", "b"], linhas: [[null, "x"]],
    });
    expect(linha).toEqual([null, { value: "x", type: String }]);
  });
});

describe("nomeArquivo", () => {
  it("junta o nome e a data, sem acento nem espaço", () => {
    expect(nomeArquivo("Fluxo de Caixa", new Date(2026, 10, 5))).toBe("fluxo-de-caixa-2026-11-05.xlsx");
    expect(nomeArquivo("Extrato Financeiro", new Date(2026, 0, 9))).toBe("extrato-financeiro-2026-01-09.xlsx");
  });
});
