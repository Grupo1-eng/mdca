import { describe, expect, it } from "vitest";
import {
  moduloDaNavegacao,
  moduloPermitido,
  podeAcessarModulo,
  rotaDoModulo,
  rotaPosLogin,
} from "./moduloDestino";

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

describe("acesso por perfil", () => {
  it("segue as regras do backend para cada módulo", () => {
    expect(podeAcessarModulo("gestao", "coordenador")).toBe(true);
    expect(podeAcessarModulo("financeiro", "coordenador")).toBe(false);
    expect(podeAcessarModulo("financeiro", "gestor_financeiro")).toBe(true);
    expect(podeAcessarModulo("gestao", "gestor_financeiro")).toBe(false);
    expect(podeAcessarModulo("financeiro", "administrativo")).toBe(true);
    expect(podeAcessarModulo("gestao", "administrativo")).toBe(true);
    expect(podeAcessarModulo("gestao", undefined)).toBe(false);
  });

  it("leva ao módulo permitido quando a escolha do login não é", () => {
    expect(rotaPosLogin({ modulo: "financeiro" }, "coordenador")).toBe("/gestao");
    expect(rotaPosLogin({ modulo: "gestao" }, "analista_financeiro")).toBe("/financeiro");
    expect(rotaPosLogin({ modulo: "financeiro" }, "administrativo")).toBe("/financeiro");
    expect(rotaPosLogin({ modulo: "gestao" }, "tecnico_psicologia")).toBe("/gestao");
  });

  it("mantém a escolha quando o perfil não acessa nenhum dos dois", () => {
    expect(moduloPermitido("financeiro", "perfil_desconhecido")).toBe("financeiro");
  });
});
