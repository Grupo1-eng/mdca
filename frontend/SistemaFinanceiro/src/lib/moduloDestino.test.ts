import { describe, expect, it } from "vitest";
import { moduloDaNavegacao, rotaDoModulo, rotaPosLogin } from "./moduloDestino";

describe("destino do módulo após o login", () => {
  it("leva a seleção Financeiro para /financeiro", () => {
    expect(rotaDoModulo("financeiro")).toBe("/financeiro");
    expect(rotaPosLogin({ modulo: "financeiro" })).toBe("/financeiro");
  });

  it("leva a seleção Gestão para /gestao", () => {
    expect(rotaDoModulo("gestao")).toBe("/gestao");
    expect(rotaPosLogin({ modulo: "gestao" })).toBe("/gestao");
  });

  it("usa Financeiro somente quando não existe uma decisão válida na navegação", () => {
    expect(moduloDaNavegacao(null)).toBe("financeiro");
    expect(moduloDaNavegacao({ modulo: "invalido" })).toBe("financeiro");
  });
});
