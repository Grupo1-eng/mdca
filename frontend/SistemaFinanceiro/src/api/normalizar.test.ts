import { describe, expect, it } from "vitest";
import { normalizarConta, normalizarLancamento, normalizarOrcamento, normalizarProjeto } from "./normalizar";

const lancamentoApi = {
  id: 1,
  contaId: 2,
  categoriaId: 3,
  projetoId: null,
  usuarioId: 7,
  contatoId: null,
  valor: "150.75",
  tipo: "saida",
  descricao: "Material",
  dataPagamento: null,
  dataCompetencia: "2026-09-24T00:00:00.000Z",
  situacao: "pendente",
  criadoEm: "2026-09-24T13:00:00.000Z",
} as const;

describe("normalizarLancamento", () => {
  it("converte o valor Decimal (texto) em número", () => {
    expect(normalizarLancamento(lancamentoApi).valor).toBe(150.75);
  });

  it("mantém os demais campos como vieram", () => {
    const l = normalizarLancamento(lancamentoApi);
    expect(l.id).toBe(1);
    expect(l.situacao).toBe("pendente");
    expect(l.dataCompetencia).toBe("2026-09-24T00:00:00.000Z");
  });
});

describe("normalizarConta", () => {
  it("converte saldos Decimal em número, inclusive negativos", () => {
    const c = normalizarConta({
      id: 1, organizacaoId: 1, nome: "Caixa", tipo: null, banco: null, agencia: null, numero: null,
      saldoInicial: "-50.5", saldoAtual: "1000", ativa: true,
    });
    expect(c.saldoInicial).toBe(-50.5);
    expect(c.saldoAtual).toBe(1000);
  });
});

describe("normalizarProjeto", () => {
  it("converte orçamento Decimal e preserva null", () => {
    const base = { id: 1, organizacaoId: 1, nome: "P", descricao: null, status: "Planejamento", dataInicio: null, dataFim: null };
    expect(normalizarProjeto({ ...base, orcamentoTotal: "2500.10" }).orcamentoTotal).toBe(2500.1);
    expect(normalizarProjeto({ ...base, orcamentoTotal: null }).orcamentoTotal).toBeNull();
  });
});

describe("normalizarOrcamento", () => {
  it("converte o valor previsto", () => {
    const o = normalizarOrcamento({ id: 1, projetoId: 1, categoriaId: 2, periodoReferencia: "2026-09", valorPrevisto: "300" });
    expect(o.valorPrevisto).toBe(300);
  });
});
