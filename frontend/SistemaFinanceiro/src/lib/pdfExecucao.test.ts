import { describe, expect, it } from "vitest";
import type { Categoria, Contato, Lancamento, Orcamento, Projeto } from "@/types/financeiro";
import { gerarPdf, type BlocoPdf, type DocumentoPdf } from "./pdf";
import { documentoExecucaoPdf } from "./pdfExecucao";
import { relatorioExecucaoProjeto } from "./relatorioProjeto";

function lanc(parcial: Partial<Lancamento>): Lancamento {
  return {
    id: 1, contaId: 1, categoriaId: 10, projetoId: 1, usuarioId: 1, contatoId: null,
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
  { id: 13, nome: "Transporte", tipo: "despesa", categoriaPaiId: null, ativa: true },
];
const contatos: Contato[] = [
  { id: 1, nome: "Fundação Alfa", tipo: null, papel: null, cpfCnpj: null, telefone: null, observacoes: null },
  { id: 2, nome: "Papelaria Beta", tipo: null, papel: null, cpfCnpj: null, telefone: null, observacoes: null },
];
const orcamentos: Orcamento[] = [
  { id: 1, projetoId: 1, categoriaId: 10, periodoReferencia: "2026", valorPrevisto: 500 },
  { id: 2, projetoId: 1, categoriaId: 12, periodoReferencia: "2026", valorPrevisto: 1000 },
];
const lancamentos: Lancamento[] = [
  lanc({ id: 1, tipo: "entrada", situacao: "recebido", valor: 2000, contatoId: 1 }),
  lanc({ id: 2, categoriaId: 10, valor: 600, contatoId: 2 }), // acima do orçado
  lanc({ id: 3, categoriaId: 12, valor: 400 }),
  lanc({ id: 4, categoriaId: 13, valor: 50 }), // sem orçamento
  lanc({ id: 5, categoriaId: 12, valor: 999, situacao: "pendente" }), // pendente não entra
];

const projeto: Projeto = {
  id: 1, organizacaoId: 1, nome: "Semear", descricao: "Oficinas para jovens", tipo: "PROGRAMA",
  status: "Em andamento", orcamentoTotal: 1500, dataInicio: "2026-01-01T00:00:00.000Z", dataFim: "2026-12-31T00:00:00.000Z",
};

function documento(parcial: { projeto?: Projeto; lancamentos?: Lancamento[]; orcamentos?: Orcamento[] } = {}): DocumentoPdf {
  const p = parcial.projeto ?? projeto;
  const relatorio = relatorioExecucaoProjeto({
    projeto: p, categorias, contatos,
    orcamentos: parcial.orcamentos ?? orcamentos,
    lancamentos: parcial.lancamentos ?? lancamentos,
    intervalo: { inicio: null, fim: null },
  });
  return documentoExecucaoPdf({
    relatorio, projeto: p, periodo: "Todo o período",
    organizacao: "MDCA", usuario: "Maria", geradoEm: new Date(2026, 10, 19, 9, 5),
  });
}

function bloco<T extends BlocoPdf["tipo"]>(doc: DocumentoPdf, tipo: T, indice = 0): Extract<BlocoPdf, { tipo: T }> {
  return doc.blocos.filter((b) => b.tipo === tipo)[indice] as Extract<BlocoPdf, { tipo: T }>;
}

function secoes(doc: DocumentoPdf): string[] {
  return doc.blocos.flatMap((b) => (b.tipo === "secao" ? [b.titulo] : []));
}

describe("documentoExecucaoPdf — cabeçalho e identificação", () => {
  it("usa o projeto no título, a organização e o período nos filtros", () => {
    const d = documento();
    expect(d.titulo).toBe("Execução Orçamentária — Semear");
    expect(d.organizacao).toBe("MDCA");
    expect(d.filtros).toEqual(["Período dos lançamentos: Todo o período"]);
  });

  it("organiza as seções na ordem do relatório", () => {
    expect(secoes(documento())).toEqual([
      "Identificação", "Resumo", "Orçado x realizado por categoria", "Entradas por origem", "Saídas por origem",
    ]);
  });

  it("identifica o projeto com tipo, situação, vigência e orçamento total", () => {
    expect(bloco(documento(), "campos").itens).toEqual([
      { rotulo: "Nome", valor: "Semear" },
      { rotulo: "Tipo", valor: "Programa" },
      { rotulo: "Situação", valor: "Em andamento" },
      { rotulo: "Vigência", valor: "01/01/2026 a 31/12/2026" },
      { rotulo: "Orçamento total", valor: "R$ 1.500,00" },
      { rotulo: "Descrição", valor: "Oficinas para jovens" },
    ]);
  });

  it("diz quando vigência, orçamento total e descrição não foram informados", () => {
    const itens = bloco(documento({ projeto: { ...projeto, descricao: null, orcamentoTotal: null, dataInicio: null, dataFim: null } }), "campos").itens;
    expect(itens).toContainEqual({ rotulo: "Vigência", valor: "Não informada" });
    expect(itens).toContainEqual({ rotulo: "Orçamento total", valor: "Não informado" });
    expect(itens).toContainEqual({ rotulo: "Descrição", valor: "Sem descrição." });
  });
});

describe("documentoExecucaoPdf — números", () => {
  it("resume orçado, realizado, execução, saldo a executar, entradas e saldo do projeto", () => {
    expect(bloco(documento(), "indicadores").itens).toEqual([
      { rotulo: "Orçado", valor: "R$ 1.500,00" },
      { rotulo: "Realizado (saídas pagas)", valor: "R$ 1.050,00" },
      { rotulo: "Executado", valor: "70%", tom: "neutro" },
      { rotulo: "Saldo a executar", valor: "R$ 450,00", tom: "neutro" },
      { rotulo: "Entradas recebidas", valor: "R$ 2.000,00", tom: "positivo" },
      { rotulo: "Saldo do projeto", valor: "R$ 950,00", tom: "neutro" },
    ]);
  });

  it("lista orçado x realizado por categoria, com alerta em texto e linha destacada", () => {
    const tabela = bloco(documento(), "tabela", 0);
    expect(tabela.linhas).toEqual([
      ["Material", 500, 600, -100, 120, "Acima do orçado"],
      ["Pessoal › Salários", 1000, 400, 600, 40, ""],
      ["Transporte", 0, 50, -50, null, "Sem orçamento"],
    ]);
    expect(tabela.linhasEmAlerta).toEqual([0, 2]);
    expect(tabela.totais).toEqual(["Total", 1500, 1050, 450, 70, null]);
  });

  it("mostra entradas e saídas por origem com a participação no total", () => {
    expect(bloco(documento(), "tabela", 1).linhas).toEqual([["Fundação Alfa", 2000, 100]]);
    expect(bloco(documento(), "tabela", 2).linhas).toEqual([
      ["Papelaria Beta", 600, 57],
      ["Sem origem informada", 450, 43],
    ]);
  });

  it("marca execução acima de 100% e saldos negativos em vermelho", () => {
    const d = documento({ lancamentos: [lanc({ categoriaId: 10, valor: 2000 })] });
    const itens = bloco(d, "indicadores").itens;
    expect(itens.find((i) => i.rotulo === "Executado")).toMatchObject({ valor: "133%", tom: "negativo" });
    expect(itens.find((i) => i.rotulo === "Saldo a executar")).toMatchObject({ valor: "-R$ 500,00", tom: "negativo" });
    expect(itens.find((i) => i.rotulo === "Saldo do projeto")).toMatchObject({ valor: "-R$ 2.000,00", tom: "negativo" });
  });

  it("projeto sem orçamento nem movimento sai com tabelas vazias e execução em traço", () => {
    const d = documento({ lancamentos: [], orcamentos: [] });
    expect(bloco(d, "indicadores").itens.find((i) => i.rotulo === "Executado")?.valor).toBe("—");
    expect(bloco(d, "tabela", 0).linhas).toEqual([]);
    expect(bloco(d, "tabela", 1).totais).toEqual(["Total", 0, null]);
  });
});

describe("documentoExecucaoPdf — critérios", () => {
  it("não tem a seção de critérios", () => {
    expect(documento().blocos.some((b) => b.tipo === "notas")).toBe(false);
  });
});

describe("documentoExecucaoPdf — geração", () => {
  it("gera um PDF válido com o relatório completo", async () => {
    const pdf = await gerarPdf(documento(), { comprimir: false });
    const saida = pdf.output();
    expect(saida.startsWith("%PDF-")).toBe(true);
    expect(saida).toContain("Acima do orçado");
    expect(saida).toContain("Fundação Alfa");
  });
});
