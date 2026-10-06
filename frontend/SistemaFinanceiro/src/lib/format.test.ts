import { describe, expect, it } from "vitest";
import { dataLocal, formatDate, paraInputData } from "./format";

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
