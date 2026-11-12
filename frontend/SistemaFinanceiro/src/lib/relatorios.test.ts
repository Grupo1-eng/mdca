import { describe, expect, it } from "vitest";
import type { Categoria, Lancamento } from "@/types/financeiro";
import { categoriasDoFiltro, filtrarExtrato, totaisFluxo, totaisPorCategoria, type FiltroExtrato } from "./relatorios";

function lanc(parcial: Partial<Lancamento>): Lancamento {
  return {
    id: 1, contaId: 1, categoriaId: 1, projetoId: null, usuarioId: 1, contatoId: null,
    valor: 100, tipo: "saida", descricao: "x", dataPagamento: null,
    dataCompetencia: "2026-09-10T00:00:00.000Z", situacao: "pago",
    criadoEm: "2026-09-01T12:00:00.000Z",
    ...parcial,
  };
}

function cat(id: number, nome: string, categoriaPaiId: number | null = null): Categoria {
  return { id, nome, tipo: "despesa", categoriaPaiId, ativa: true };
}

const categorias = [cat(1, "Pessoal"), cat(2, "Salários", 1), cat(3, "Encargos", 1), cat(4, "Material")];
const setembro = { inicio: new Date(2026, 8, 1), fim: new Date(2026, 8, 30, 23, 59, 59) };
const tudo: FiltroExtrato = { intervalo: { inicio: null, fim: null }, projetoId: null, categoriaId: null, tipo: "todos", termo: "" };

describe("categoriasDoFiltro", () => {
  it("categoria principal inclui as subcategorias", () => {
    expect(categoriasDoFiltro(categorias, 1)).toEqual(new Set([1, 2, 3]));
  });

  it("subcategoria inclui só ela mesma", () => {
    expect(categoriasDoFiltro(categorias, 2)).toEqual(new Set([2]));
  });

  it("sem categoria escolhida não restringe nada", () => {
    expect(categoriasDoFiltro(categorias, null)).toBeNull();
  });
});

// RF07: relatório por projeto, por período e por categoria de despesa.
describe("filtrarExtrato", () => {
  const lancamentos = [
    lanc({ id: 1, projetoId: 10, categoriaId: 2, descricao: "Folha de setembro" }),
    lanc({ id: 2, projetoId: 20, categoriaId: 4, descricao: "Papel" }),
    lanc({ id: 3, projetoId: 10, categoriaId: 4, tipo: "entrada", descricao: "Doação" }),
    lanc({ id: 4, projetoId: 10, categoriaId: 2, dataCompetencia: "2026-08-10T00:00:00.000Z", descricao: "Folha de agosto" }),
  ];
  const nomeProjeto = new Map([[10, "Oficinas"], [20, "Esporte"]]);
  const ids = (filtro: Partial<typeof tudo>) =>
    filtrarExtrato(lancamentos, { ...tudo, ...filtro }, categorias, nomeProjeto).map((l) => l.id);

  it("filtra pelo período", () => {
    expect(ids({ intervalo: setembro })).toEqual([1, 2, 3]);
  });

  it("filtra pelo projeto", () => {
    expect(ids({ projetoId: 20 })).toEqual([2]);
  });

  it("filtra pela categoria, incluindo as subcategorias", () => {
    expect(ids({ categoriaId: 1 })).toEqual([1, 4]);
  });

  it("filtra pelo tipo e pelo texto (descrição ou nome do projeto)", () => {
    expect(ids({ tipo: "entrada" })).toEqual([3]);
    expect(ids({ termo: "folha" })).toEqual([1, 4]);
    expect(ids({ termo: "ESPORTE" })).toEqual([2]);
  });

  it("combina todos os filtros", () => {
    expect(ids({ intervalo: setembro, projetoId: 10, categoriaId: 1, tipo: "saida" })).toEqual([1]);
  });
});

describe("totaisPorCategoria", () => {
  it("soma entradas e saídas por categoria, com o nome da categoria principal antes da sub", () => {
    const totais = totaisPorCategoria([
      lanc({ categoriaId: 2, valor: 1000 }),
      lanc({ categoriaId: 2, valor: 500 }),
      lanc({ categoriaId: 4, valor: 80 }),
      lanc({ categoriaId: 4, valor: 30, tipo: "entrada" }),
    ], categorias);
    expect(totais).toEqual([
      { categoria: "Pessoal › Salários", entradas: 0, saidas: 1500 },
      { categoria: "Material", entradas: 30, saidas: 80 },
    ]);
  });

  it("categoria que não veio na lista aparece pelo id", () => {
    expect(totaisPorCategoria([lanc({ categoriaId: 99 })], categorias)[0].categoria).toBe("Categoria 99");
  });
});

describe("totaisFluxo", () => {
  it("soma cada coluna da série e calcula o saldo realizado", () => {
    expect(totaisFluxo([
      { label: "a", realizado: 300, previsto: 500, saidasRealizado: 100, saidasPrevisto: 150 },
      { label: "b", realizado: 0, previsto: 50, saidasRealizado: 20, saidasPrevisto: 20 },
    ])).toEqual({
      entradasPrevistas: 550, entradasRealizadas: 300, saidasPrevistas: 170, saidasRealizadas: 120, saldoRealizado: 180,
    });
  });
});
