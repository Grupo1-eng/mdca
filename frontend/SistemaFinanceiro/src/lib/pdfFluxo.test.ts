import { describe, expect, it } from "vitest";
import type { Lancamento } from "@/types/financeiro";
import { serieFluxoCaixaPeriodo, type Intervalo } from "./aggregations";
import { gerarPdf, type BlocoPdf, type DocumentoPdf } from "./pdf";
import { documentoFluxoPdf } from "./pdfFluxo";

let proximoId = 1;
function lanc(parcial: Partial<Lancamento>): Lancamento {
  return {
    id: proximoId++, contaId: 1, categoriaId: 10, projetoId: null, usuarioId: 1, contatoId: null,
    valor: 100, tipo: "saida", descricao: "x", dataPagamento: null,
    dataCompetencia: "2026-11-03T00:00:00.000Z", situacao: "pago",
    criadoEm: "2026-11-01T12:00:00.000Z",
    ...parcial,
  };
}

const novembro: Intervalo = { inicio: new Date(2026, 10, 1), fim: new Date(2026, 10, 30) };

const lancamentos = [
  lanc({ tipo: "entrada", situacao: "recebido", valor: 1000, dataCompetencia: "2026-11-02T00:00:00.000Z" }),
  lanc({ tipo: "entrada", situacao: "pendente", valor: 500, dataCompetencia: "2026-11-20T00:00:00.000Z" }),
  lanc({ valor: 300, dataCompetencia: "2026-11-03T00:00:00.000Z" }),
  lanc({ valor: 900, situacao: "pendente", dataCompetencia: "2026-11-25T00:00:00.000Z" }),
];

function documento(intervalo: Intervalo = novembro, lista: Lancamento[] = lancamentos): DocumentoPdf {
  const serie = serieFluxoCaixaPeriodo(lista, intervalo);
  return documentoFluxoPdf({
    agrupamento: serie.agrupamento, pontos: serie.pontos, periodo: "novembro de 2026",
    organizacao: "MDCA", usuario: "Maria", geradoEm: new Date(2026, 10, 19, 9, 5),
  });
}

function bloco<T extends BlocoPdf["tipo"]>(doc: DocumentoPdf, tipo: T): Extract<BlocoPdf, { tipo: T }> {
  return doc.blocos.find((b) => b.tipo === tipo) as Extract<BlocoPdf, { tipo: T }>;
}

describe("documentoFluxoPdf", () => {
  it("informa período e agrupamento no cabeçalho", () => {
    const d = documento();
    expect(d.titulo).toBe("Fluxo de Caixa");
    expect(d.filtros).toEqual(["Período: novembro de 2026", "Agrupado por semana"]);
  });

  it("resume realizado e previsto, com resultado de cada um", () => {
    expect(bloco(documento(), "indicadores").itens).toEqual([
      { rotulo: "Entradas realizadas", valor: "R$ 1.000,00", tom: "positivo" },
      { rotulo: "Saídas realizadas", valor: "R$ 300,00", tom: "negativo" },
      { rotulo: "Resultado realizado", valor: "R$ 700,00", tom: "neutro" },
      { rotulo: "Entradas previstas", valor: "R$ 1.500,00" },
      { rotulo: "Saídas previstas", valor: "R$ 1.200,00" },
      { rotulo: "Resultado previsto", valor: "R$ 300,00", tom: "neutro" },
    ]);
  });

  it("marca resultado negativo em vermelho", () => {
    const d = documento(novembro, [lanc({ valor: 50 })]);
    const itens = bloco(d, "indicadores").itens;
    expect(itens.find((i) => i.rotulo === "Resultado realizado")).toMatchObject({ valor: "-R$ 50,00", tom: "negativo" });
    expect(itens.find((i) => i.rotulo === "Resultado previsto")).toMatchObject({ valor: "-R$ 50,00", tom: "negativo" });
  });

  it("tem uma linha por semana, inclusive as vazias, e o total", () => {
    const tabela = bloco(documento(), "tabela");
    expect(tabela.linhas).toEqual([
      ["Semana de 01/11", 1000, 1000, 300, 300, 700],
      ["Semana de 08/11", 0, 0, 0, 0, 0],
      ["Semana de 15/11", 500, 0, 0, 0, 0],
      ["Semana de 22/11", 0, 0, 900, 0, 0],
      ["Semana de 29/11", 0, 0, 0, 0, 0],
    ]);
    expect(tabela.totais).toEqual(["Total", 1500, 1000, 1200, 300, 700]);
  });

  it("agrupado por mês, mantém o rótulo do mês e o título da seção acompanha", () => {
    const d = documento({ inicio: new Date(2026, 0, 1), fim: new Date(2026, 11, 31) });
    expect(d.filtros).toContain("Agrupado por mês");
    expect(d.blocos).toContainEqual({ tipo: "secao", titulo: "Realizado x previsto por mês" });
    expect(bloco(d, "tabela").linhas[10][0]).toBe("nov/26");
  });

  it("divide as entradas previstas em recebidas e a receber, e as saídas em pagas e a pagar", () => {
    const [entradas, saidas] = bloco(documento(), "pizzas").graficos;
    expect(entradas).toMatchObject({
      titulo: "Entradas previstas x realizadas",
      fatias: [{ rotulo: "Recebidas", valor: 1000 }, { rotulo: "A receber", valor: 500 }],
      rodape: "Previstas: R$ 1.500,00",
    });
    expect(saidas).toMatchObject({
      titulo: "Saídas previstas x realizadas",
      fatias: [{ rotulo: "Pagas", valor: 300 }, { rotulo: "A pagar", valor: 900 }],
      rodape: "Previstas: R$ 1.200,00",
    });
  });

  it("as fatias de cada pizza somam o previsto, sem contar o realizado duas vezes", () => {
    for (const g of bloco(documento(), "pizzas").graficos) {
      const soma = g.fatias.reduce((a, f) => a + f.valor, 0);
      expect(g.rodape).toBe(`Previstas: R$ ${soma.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    }
  });

  it("a parte pendente não guarda resíduo de ponto flutuante", () => {
    const d = documento(novembro, [
      lanc({ tipo: "entrada", situacao: "recebido", valor: 0.1 }),
      lanc({ tipo: "entrada", situacao: "pendente", valor: 0.2 }),
    ]);
    expect(bloco(d, "pizzas").graficos[0].fatias[1].valor).toBe(0.2);
  });

  it("não tem a seção de critérios", () => {
    expect(documento().blocos.some((b) => b.tipo === "notas")).toBe(false);
  });

  it("gera um PDF válido", async () => {
    const saida = (await gerarPdf(documento(), { comprimir: false })).output();
    expect(saida.startsWith("%PDF-")).toBe(true);
    expect(saida).toContain("Semana de 22/11");
  });
});
