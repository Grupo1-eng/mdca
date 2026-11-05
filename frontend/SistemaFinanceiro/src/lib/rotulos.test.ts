import { describe, expect, it } from "vitest";
import { situacoesDoTipo } from "./rotulos";

// Mesma regra do backend (regras-lancamento.ts): entrada se realiza ao ser
// recebida; saída, ao ser paga.
describe("situacoesDoTipo", () => {
  it("entrada: previsto ou recebido", () => {
    expect(situacoesDoTipo("entrada")).toEqual(["pendente", "recebido"]);
  });

  it("saída: previsto ou pago", () => {
    expect(situacoesDoTipo("saida")).toEqual(["pendente", "pago"]);
  });
});
