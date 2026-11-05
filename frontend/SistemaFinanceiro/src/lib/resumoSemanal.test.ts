import { describe, expect, it } from "vitest";
import { mesDoPeriodo, nomeDoMes, queryResumoSemanal, rotuloSemana, somarMeses } from "./resumoSemanal";

describe("queryResumoSemanal", () => {
  it("só o mês quando o filtro é todos os projetos", () => {
    expect(queryResumoSemanal("2026-11", "todos")).toBe("?mes=2026-11");
  });

  it("acrescenta o projeto escolhido ou 'nenhum'", () => {
    expect(queryResumoSemanal("2026-11", 12)).toBe("?mes=2026-11&projetoId=12");
    expect(queryResumoSemanal("2026-11", "nenhum")).toBe("?mes=2026-11&projetoId=nenhum");
  });
});

const hoje = new Date(2026, 10, 5); // 05/11/2026

describe("mesDoPeriodo", () => {
  it("usa o mês de hoje quando hoje está dentro do período", () => {
    expect(mesDoPeriodo({ inicio: new Date(2026, 10, 1), fim: new Date(2026, 10, 30) }, hoje)).toBe("2026-11");
  });

  it("usa o mês de hoje quando o período é aberto (todos)", () => {
    expect(mesDoPeriodo({ inicio: null, fim: null }, hoje)).toBe("2026-11");
  });

  it("usa o mês do início quando o período personalizado não inclui hoje", () => {
    expect(mesDoPeriodo({ inicio: new Date(2026, 7, 10), fim: new Date(2026, 8, 20) }, hoje)).toBe("2026-08");
  });

  it("usa o mês do fim quando só o fim foi informado e ele é anterior a hoje", () => {
    expect(mesDoPeriodo({ inicio: null, fim: new Date(2026, 2, 15) }, hoje)).toBe("2026-03");
  });

  it("completa o mês com zero à esquerda", () => {
    expect(mesDoPeriodo({ inicio: null, fim: null }, new Date(2027, 0, 1))).toBe("2027-01");
  });
});

// RF30: cada semana do mês precisa ser identificável no gráfico.
describe("rotuloSemana", () => {
  it("mostra o intervalo de dias da semana em DD/MM", () => {
    expect(rotuloSemana({ inicio: "2026-11-01", fim: "2026-11-07" })).toBe("01/11 – 07/11");
  });

  it("funciona com a última semana curta do mês", () => {
    expect(rotuloSemana({ inicio: "2026-11-29", fim: "2026-11-30" })).toBe("29/11 – 30/11");
  });
});

describe("nomeDoMes", () => {
  it("escreve o mês por extenso com o ano", () => {
    expect(nomeDoMes("2026-11")).toBe("novembro de 2026");
  });
});

describe("somarMeses", () => {
  it("avança e volta meses atravessando o ano", () => {
    expect(somarMeses("2026-12", 1)).toBe("2027-01");
    expect(somarMeses("2026-01", -1)).toBe("2025-12");
    expect(somarMeses("2026-11", 0)).toBe("2026-11");
  });
});
