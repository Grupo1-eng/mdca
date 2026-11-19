import { describe, expect, it } from "vitest";
import type { Categoria, Lancamento } from "@/types/financeiro";
import { gerarPdf, type BlocoPdf, type DocumentoPdf } from "./pdf";
import { documentoExtratoPdf } from "./pdfExtrato";

function lanc(parcial: Partial<Lancamento>): Lancamento {
  return {
    id: 1, contaId: 1, categoriaId: 10, projetoId: null, usuarioId: 1, contatoId: null,
    valor: 100, tipo: "saida", descricao: "x", dataPagamento: null,
    dataCompetencia: "2026-11-10T00:00:00.000Z", situacao: "pago",
    criadoEm: "2026-11-01T12:00:00.000Z",
    ...parcial,
  };
}

const categorias: Categoria[] = [
  { id: 10, nome: "Material", tipo: "despesa", categoriaPaiId: null, ativa: true },
  { id: 11, nome: "Pessoal", tipo: "despesa", categoriaPaiId: null, ativa: true },
  { id: 12, nome: "Salários", tipo: "despesa", categoriaPaiId: 11, ativa: true },
  { id: 20, nome: "Doações", tipo: "receita", categoriaPaiId: null, ativa: true },
];

const lancamentos: Lancamento[] = [
  lanc({ id: 3, categoriaId: 12, valor: 400, descricao: "Folha", dataCompetencia: "2026-11-20T00:00:00.000Z", contatoId: 2 }),
  lanc({ id: 1, tipo: "entrada", situacao: "recebido", categoriaId: 20, valor: 2000, descricao: "Doação", contatoId: 1, projetoId: 7, dataCompetencia: "2026-11-02T00:00:00.000Z" }),
  lanc({ id: 2, categoriaId: 10, valor: 150.1, situacao: "pendente", descricao: "Papel", dataCompetencia: "2026-11-05T00:00:00.000Z" }),
  lanc({ id: 4, tipo: "entrada", situacao: "pendente", categoriaId: 20, valor: 300.2, descricao: "Rifa", dataCompetencia: "2026-11-05T00:00:00.000Z" }),
];

function documento(lista: Lancamento[] = lancamentos): DocumentoPdf {
  return documentoExtratoPdf({
    lancamentos: lista,
    categorias,
    nomeProjeto: new Map([[7, "Semear"]]),
    nomeConta: new Map([[1, "Conta corrente"]]),
    nomeContato: new Map([[1, "Fundação Alfa"], [2, "Equipe"]]),
    filtros: ["Período: novembro de 2026", "Projeto: Todos"],
    organizacao: "MDCA",
    usuario: "Maria",
    geradoEm: new Date(2026, 10, 19, 9, 5),
  });
}

function tabela(doc: DocumentoPdf, indice: number): Extract<BlocoPdf, { tipo: "tabela" }> {
  return doc.blocos.filter((b) => b.tipo === "tabela")[indice] as Extract<BlocoPdf, { tipo: "tabela" }>;
}

describe("documentoExtratoPdf", () => {
  it("sai em paisagem, com os filtros aplicados no cabeçalho", () => {
    const d = documento();
    expect(d.titulo).toBe("Extrato Financeiro");
    expect(d.orientacao).toBe("paisagem");
    expect(d.filtros).toEqual(["Período: novembro de 2026", "Projeto: Todos"]);
  });

  it("separa no resumo o que foi realizado do que está pendente", () => {
    const itens = (documento().blocos.find((b) => b.tipo === "indicadores") as Extract<BlocoPdf, { tipo: "indicadores" }>).itens;
    expect(itens).toEqual([
      { rotulo: "Entradas recebidas", valor: "R$ 2.000,00", tom: "positivo" },
      { rotulo: "Saídas pagas", valor: "R$ 400,00", tom: "negativo" },
      { rotulo: "Resultado realizado", valor: "R$ 1.600,00", tom: "neutro" },
      { rotulo: "Entradas a receber", valor: "R$ 300,20" },
      { rotulo: "Saídas a pagar", valor: "R$ 150,10" },
      { rotulo: "Resultado previsto", valor: "R$ 1.750,10", tom: "neutro" },
    ]);
  });

  it("lista os lançamentos em ordem cronológica, com categoria completa, favorecido e situação", () => {
    expect(tabela(documento(), 0).linhas).toEqual([
      ["02/11/2026", "Doação", "Semear", "Conta corrente", "Doações", "Fundação Alfa", "Recebido", 2000, ""],
      ["05/11/2026", "Papel", "", "Conta corrente", "Material", "", "Previsto", "", 150.1],
      ["05/11/2026", "Rifa", "", "Conta corrente", "Doações", "", "Previsto", 300.2, ""],
      ["20/11/2026", "Folha", "", "Conta corrente", "Pessoal › Salários", "Equipe", "Pago", "", 400],
    ]);
  });

  it("conta os lançamentos no título da seção e soma cada coluna no total", () => {
    const d = documento();
    expect(d.blocos).toContainEqual({ tipo: "secao", titulo: "Lançamentos (4 lançamentos)" });
    expect(tabela(d, 0).totais).toEqual(["Total", "4 lançamentos", null, null, null, null, null, 2300.2, 550.1]);
    expect(documento([lancamentos[0]]).blocos).toContainEqual({ tipo: "secao", titulo: "Lançamentos (1 lançamento)" });
  });

  it("traz os totais por categoria em ordem alfabética", () => {
    const porCategoria = tabela(documento(), 1);
    expect(porCategoria.linhas).toEqual([
      ["Doações", 2300.2, null],
      ["Material", null, 150.1],
      ["Pessoal › Salários", null, 400],
    ]);
    expect(porCategoria.totais).toEqual(["Total", 2300.2, 550.1]);
  });

  it("marca resultado negativo em vermelho", () => {
    const d = documento([lanc({ valor: 80 })]);
    const itens = (d.blocos.find((b) => b.tipo === "indicadores") as Extract<BlocoPdf, { tipo: "indicadores" }>).itens;
    expect(itens.find((i) => i.rotulo === "Resultado realizado")).toMatchObject({ valor: "-R$ 80,00", tom: "negativo" });
  });

  it("não tem seção de critérios", () => {
    expect(documento().blocos.some((b) => b.tipo === "notas")).toBe(false);
  });

  it("gera um PDF válido em A4 paisagem", async () => {
    const pdf = await gerarPdf(documento(), { comprimir: false });
    expect(Math.round(pdf.internal.pageSize.getWidth())).toBe(297);
    expect(pdf.output()).toContain("Fundação Alfa");
  });
});
