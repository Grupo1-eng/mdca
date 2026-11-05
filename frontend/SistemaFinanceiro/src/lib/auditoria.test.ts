import { describe, expect, it } from "vitest";
import { descreverAlteracao, formatarDataHora, formatarValor, nomeCampo, podeVerAuditoria } from "./auditoria";

describe("podeVerAuditoria", () => {
  it("só coordenação e gestão financeira", () => {
    expect(podeVerAuditoria("coordenador_financeiro")).toBe(true);
    expect(podeVerAuditoria("gestor_financeiro")).toBe(true);
    expect(podeVerAuditoria("analista_financeiro")).toBe(false);
    expect(podeVerAuditoria("administrativo")).toBe(false);
    expect(podeVerAuditoria("coordenador")).toBe(false);
    expect(podeVerAuditoria(undefined)).toBe(false);
  });
});

describe("descreverAlteracao", () => {
  it("edição mostra antes → depois com rótulos da tela", () => {
    expect(descreverAlteracao("situacao", { de: "pendente", para: "pago" })).toBe("Previsto → Pago");
    expect(descreverAlteracao("ativa", { de: true, para: false })).toBe("Sim → Não");
    expect(descreverAlteracao("perfil", { de: "educador", para: "gestor_financeiro" })).toBe("Educador(a) → Gestão financeira");
  });

  it("criação e exclusão mostram só o valor", () => {
    expect(descreverAlteracao("valor", { para: "150" })).toBe("150");
    expect(descreverAlteracao("nome", { de: "Caixa" })).toBe("Caixa");
  });

  it("campo sensível não mostra conteúdo", () => {
    expect(descreverAlteracao("telefone", { alterado: true })).toBe("alterado (conteúdo não registrado)");
  });

  it("vazio vira travessão e data ISO vira data pt-BR", () => {
    expect(descreverAlteracao("descricao", { de: null, para: "Luz" })).toBe("— → Luz");
    expect(formatarValor("dataPagamento", "2026-10-05T00:00:00.000Z")).toBe("05/10/2026");
  });
});

describe("formatação", () => {
  it("nome do campo tem rótulo, com o próprio nome como reserva", () => {
    expect(nomeCampo("saldoAtual")).toBe("Saldo atual");
    expect(nomeCampo("campoNovo")).toBe("campoNovo");
  });

  it("data e hora no horário de Brasília", () => {
    expect(formatarDataHora("2026-10-29T15:00:00Z")).toBe("29/10/2026, 12:00:00");
  });
});
