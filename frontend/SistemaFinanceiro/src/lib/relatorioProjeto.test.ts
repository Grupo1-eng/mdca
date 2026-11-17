import { describe, expect, it } from "vitest";
import type { Categoria, Contato, Lancamento, Orcamento, Projeto } from "@/types/financeiro";
import { relatorioExecucaoProjeto, SEM_ORIGEM, type EntradaRelatorioProjeto } from "./relatorioProjeto";

function lanc(parcial: Partial<Lancamento>): Lancamento {
  return {
    id: 1, contaId: 1, categoriaId: 10, projetoId: 1, usuarioId: 1, contatoId: null,
    valor: 100, tipo: "saida", descricao: "x", dataPagamento: null,
    dataCompetencia: "2026-09-10T00:00:00.000Z", situacao: "pago",
    criadoEm: "2026-09-01T12:00:00.000Z",
    ...parcial,
  };
}

function cat(id: number, nome: string, categoriaPaiId: number | null = null): Categoria {
  return { id, nome, tipo: "despesa", categoriaPaiId, ativa: true };
}

function orc(id: number, categoriaId: number, valorPrevisto: number, projetoId = 1): Orcamento {
  return { id, projetoId, categoriaId, periodoReferencia: "2026", valorPrevisto };
}

function contato(id: number, nome: string): Contato {
  return { id, nome, tipo: null, papel: null, cpfCnpj: null, telefone: null, observacoes: null };
}

const projeto: Projeto = {
  id: 1, organizacaoId: 1, nome: "Semear", descricao: "Oficinas para jovens", status: "Em andamento",
  orcamentoTotal: null, dataInicio: null, dataFim: null,
};

const categorias = [cat(10, "Material"), cat(11, "Pessoal"), cat(12, "Salários", 11), cat(13, "Transporte")];
const contatos = [contato(1, "Fundação Alfa"), contato(2, "Papelaria Beta")];
const aberto = { inicio: null, fim: null };

function gerar(parcial: Partial<EntradaRelatorioProjeto>) {
  return relatorioExecucaoProjeto({
    projeto, categorias, orcamentos: [], lancamentos: [], contatos, intervalo: aberto, ...parcial,
  });
}

describe("relatorioExecucaoProjeto — resumo do projeto", () => {
  it("traz os dados do projeto", () => {
    const r = gerar({});
    expect(r).toMatchObject({ projetoId: 1, nome: "Semear", descricao: "Oficinas para jovens", status: "Em andamento" });
  });

  it("soma entradas recebidas e saídas pagas e calcula o saldo", () => {
    const r = gerar({
      lancamentos: [
        lanc({ id: 1, tipo: "entrada", situacao: "recebido", valor: 5000 }),
        lanc({ id: 2, tipo: "saida", situacao: "pago", valor: 1200.5 }),
        lanc({ id: 3, tipo: "saida", situacao: "pago", valor: 300.25 }),
      ],
    });
    expect(r.totalEntradas).toBe(5000);
    expect(r.totalSaidas).toBe(1500.75);
    expect(r.saldo).toBe(3499.25);
  });

  it("ignora lançamentos pendentes", () => {
    const r = gerar({
      lancamentos: [
        lanc({ id: 1, tipo: "entrada", situacao: "pendente", valor: 9999 }),
        lanc({ id: 2, tipo: "saida", situacao: "pendente", valor: 9999 }),
      ],
    });
    expect(r).toMatchObject({ totalEntradas: 0, totalSaidas: 0, saldo: 0 });
  });

  it("ignora lançamentos de outros projetos e sem projeto", () => {
    const r = gerar({
      lancamentos: [
        lanc({ id: 1, projetoId: 2, valor: 777 }),
        lanc({ id: 2, projetoId: null, valor: 888 }),
        lanc({ id: 3, projetoId: 1, valor: 50 }),
      ],
    });
    expect(r.totalSaidas).toBe(50);
  });

  it("evita resíduo de ponto flutuante nos totais", () => {
    const r = gerar({
      lancamentos: [lanc({ id: 1, valor: 0.1 }), lanc({ id: 2, valor: 0.2 })],
    });
    expect(r.totalSaidas).toBe(0.3);
  });

  it("projeto sem lançamentos nem orçamento gera relatório vazio", () => {
    const r = gerar({});
    expect(r).toMatchObject({
      totalEntradas: 0, totalSaidas: 0, saldo: 0, totalOrcado: 0, totalRealizado: 0,
      percentualExecucao: null, entradasPorOrigem: [], saidasPorOrigem: [], categorias: [],
    });
  });
});

describe("relatorioExecucaoProjeto — período", () => {
  const lancamentos = [
    lanc({ id: 1, valor: 100, dataCompetencia: "2026-09-10T00:00:00.000Z" }),
    lanc({ id: 2, valor: 200, dataCompetencia: "2026-08-10T00:00:00.000Z" }),
  ];
  const setembro = { inicio: new Date(2026, 8, 1), fim: new Date(2026, 8, 30, 23, 59, 59) };

  it("considera só os lançamentos do período", () => {
    expect(gerar({ lancamentos, intervalo: setembro }).totalSaidas).toBe(100);
  });

  it("sem limites considera todo o período", () => {
    expect(gerar({ lancamentos, intervalo: aberto }).totalSaidas).toBe(300);
  });

  it("não recorta o orçado pelo período", () => {
    const r = gerar({ orcamentos: [orc(1, 10, 1000)], lancamentos, intervalo: setembro });
    expect(r.totalOrcado).toBe(1000);
  });
});

describe("relatorioExecucaoProjeto — origem", () => {
  it("agrupa entradas e saídas pelo contato, do maior valor para o menor", () => {
    const r = gerar({
      lancamentos: [
        lanc({ id: 1, tipo: "entrada", situacao: "recebido", valor: 1000, contatoId: 1 }),
        lanc({ id: 2, tipo: "entrada", situacao: "recebido", valor: 500, contatoId: 1 }),
        lanc({ id: 3, tipo: "entrada", situacao: "recebido", valor: 2000, contatoId: 2 }),
        lanc({ id: 4, tipo: "saida", situacao: "pago", valor: 80, contatoId: 2 }),
      ],
    });
    expect(r.entradasPorOrigem).toEqual([
      { contatoId: 2, origem: "Papelaria Beta", valor: 2000 },
      { contatoId: 1, origem: "Fundação Alfa", valor: 1500 },
    ]);
    expect(r.saidasPorOrigem).toEqual([{ contatoId: 2, origem: "Papelaria Beta", valor: 80 }]);
  });

  it("lançamento sem contato vai para \"Sem origem informada\"", () => {
    const r = gerar({ lancamentos: [lanc({ id: 1, tipo: "entrada", situacao: "recebido", valor: 10, contatoId: null })] });
    expect(r.entradasPorOrigem).toEqual([{ contatoId: null, origem: SEM_ORIGEM, valor: 10 }]);
  });

  it("contato que não está na lista mostra o id", () => {
    const r = gerar({ lancamentos: [lanc({ id: 1, valor: 10, contatoId: 99 })] });
    expect(r.saidasPorOrigem[0].origem).toBe("Contato 99");
  });
});

describe("relatorioExecucaoProjeto — categorias", () => {
  it("compara orçado e realizado por categoria, com diferença e percentual", () => {
    const r = gerar({
      orcamentos: [orc(1, 10, 1000), orc(2, 13, 500)],
      lancamentos: [
        lanc({ id: 1, categoriaId: 10, valor: 300 }),
        lanc({ id: 2, categoriaId: 10, valor: 200 }),
      ],
    });
    expect(r.categorias).toEqual([
      { categoriaId: 10, categoria: "Material", orcado: 1000, realizado: 500, diferenca: 500, percentual: 50, estourada: false },
      { categoriaId: 13, categoria: "Transporte", orcado: 500, realizado: 0, diferenca: 500, percentual: 0, estourada: false },
    ]);
    expect(r).toMatchObject({ totalOrcado: 1500, totalRealizado: 500, totalDiferenca: 1000, percentualExecucao: 33 });
  });

  it("soma vários orçamentos da mesma categoria", () => {
    const r = gerar({ orcamentos: [orc(1, 10, 400), orc(2, 10, 600)] });
    expect(r.categorias[0].orcado).toBe(1000);
  });

  it("ignora orçamentos de outros projetos", () => {
    const r = gerar({ orcamentos: [orc(1, 10, 400, 2)] });
    expect(r.categorias).toEqual([]);
    expect(r.totalOrcado).toBe(0);
  });

  it("marca como estourada a categoria que passou do orçado", () => {
    const r = gerar({
      orcamentos: [orc(1, 10, 100)],
      lancamentos: [lanc({ id: 1, categoriaId: 10, valor: 150 })],
    });
    expect(r.categorias[0]).toMatchObject({ diferenca: -50, percentual: 150, estourada: true });
  });

  it("categoria com gasto e sem orçamento aparece, estourada e sem percentual", () => {
    const r = gerar({
      orcamentos: [orc(1, 10, 100)],
      lancamentos: [lanc({ id: 1, categoriaId: 13, valor: 70 })],
    });
    const transporte = r.categorias.find((c) => c.categoriaId === 13);
    expect(transporte).toMatchObject({ orcado: 0, realizado: 70, diferenca: -70, percentual: null, estourada: true });
    expect(r.totalRealizado).toBe(70);
    expect(r.totalRealizado).toBe(r.totalSaidas);
  });

  it("nomeia a subcategoria com a categoria principal", () => {
    const r = gerar({ orcamentos: [orc(1, 12, 100)] });
    expect(r.categorias[0].categoria).toBe("Pessoal › Salários");
  });

  it("categoria desconhecida mostra o id", () => {
    const r = gerar({ orcamentos: [orc(1, 99, 100)] });
    expect(r.categorias[0].categoria).toBe("Categoria 99");
  });

  it("ordena por nome", () => {
    const r = gerar({ orcamentos: [orc(1, 13, 1), orc(2, 10, 1), orc(3, 12, 1)] });
    expect(r.categorias.map((c) => c.categoria)).toEqual(["Material", "Pessoal › Salários", "Transporte"]);
  });

  it("não conta entrada nem saída pendente no realizado", () => {
    const r = gerar({
      orcamentos: [orc(1, 10, 100)],
      lancamentos: [
        lanc({ id: 1, categoriaId: 10, valor: 40, situacao: "pendente" }),
        lanc({ id: 2, categoriaId: 10, valor: 60, tipo: "entrada", situacao: "recebido" }),
      ],
    });
    expect(r.categorias[0].realizado).toBe(0);
  });
});