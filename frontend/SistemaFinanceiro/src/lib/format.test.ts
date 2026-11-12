import { describe, expect, it } from "vitest";
import { campoParaIso, dataLocal, formatData, formatDate, isoParaCampo, mascaraData, paraInputData } from "./format";

describe("formatDate", () => {
  it("formata a data ISO completa que o backend devolve", () => {
    expect(formatDate("2026-09-24T00:00:00.000Z")).toBe("24/09/2026");
  });

  it("formata data curta YYYY-MM-DD", () => {
    expect(formatDate("2026-09-24")).toBe("24/09/2026");
  });

  it("mostra traço quando não há data", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("dataLocal", () => {
  // O backend grava a data do formulário como meia-noite UTC. Interpretada em
  // UTC-3, `new Date(iso)` cairia às 21h do dia anterior.
  it("lê a data no dia correto, independentemente do fuso", () => {
    const d = dataLocal("2026-09-01T00:00:00.000Z");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(1);
  });
});

describe("paraInputData", () => {
  it("converte a data do backend para o valor de um <input type=date>", () => {
    expect(paraInputData("2026-09-24T00:00:00.000Z")).toBe("2026-09-24");
    expect(paraInputData(null)).toBe("");
  });
});

describe("campo de data DD/MM/AAAA", () => {
  it("formata um Date local", () => {
    expect(formatData(new Date(2026, 0, 5))).toBe("05/01/2026");
  });

  it("aplica a máscara enquanto a pessoa digita", () => {
    expect(mascaraData("2")).toBe("2");
    expect(mascaraData("2410")).toBe("24/10");
    expect(mascaraData("241020")).toBe("24/10/20");
    expect(mascaraData("24102026")).toBe("24/10/2026");
    expect(mascaraData("24/10/20265")).toBe("24/10/2026");
  });

  it("converte o texto digitado para ISO e volta", () => {
    expect(campoParaIso("24/10/2026")).toBe("2026-10-24");
    expect(isoParaCampo("2026-10-24")).toBe("24/10/2026");
    expect(isoParaCampo("")).toBe("");
  });

  it("recusa data incompleta ou inexistente", () => {
    expect(campoParaIso("24/10")).toBeNull();
    expect(campoParaIso("24/10/26")).toBeNull();
    expect(campoParaIso("31/02/2026")).toBeNull();
    expect(campoParaIso("00/10/2026")).toBeNull();
    expect(campoParaIso("10/13/2026")).toBeNull();
  });
});
