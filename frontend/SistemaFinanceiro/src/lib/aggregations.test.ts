import { describe, expect, it } from "vitest";
import type { Categoria, Lancamento, Orcamento, Projeto } from "@/types/financeiro";
import {
  arvoreCategorias,
  contasPendentes,
  dataDoLancamento,
  execucaoOrcamentaria,
  filtrarPorIntervalo,
  getIntervaloPeriodo,
  intervaloValido,
  resumoPeriodo,
  serieFluxoCaixa,
} from "./aggregations";

function lanc(parcial: Partial<Lancamento>): Lancamento {
  return {
    id: 1, contaId: 1, categoriaId: 1, projetoId: null, usuarioId: 1, contatoId: null,
    valor: 100, tipo: "entrada", descricao: "x", dataPagamento: null,
    dataCompetencia: "2026-09-10T00:00:00.000Z", situacao: "pendente",
    criadoEm: "2026-09-01T12:00:00.000Z",
    ...parcial,
  };
}

const setembro = { inicio: new Date(2026, 8, 1), fim: new Date(2026, 8, 30, 23, 59, 59) };

describe("dataDoLancamento", () => {
  it("usa a competência, depois o pagamento, depois a criação", () => {
    expect(dataDoLancamento(lanc({ dataCompetencia: "2026-09-10T00:00:00.000Z", dataPagamento: "2026-09-12T00:00:00.000Z" }))).toBe("2026-09-10T00:00:00.000Z");
    expect(dataDoLancamento(lanc({ dataCompetencia: null, dataPagamento: "2026-09-12T00:00:00.000Z" }))).toBe("2026-09-12T00:00:00.000Z");
    expect(dataDoLancamento(lanc({ dataCompetencia: null, dataPagamento: null }))).toBe("2026-09-01T12:00:00.000Z");
  });
});

describe("resumoPeriodo", () => {
  it("soma entradas e saídas pelo tipo, com valores positivos", () => {
    const r = resumoPeriodo([
      lanc({ tipo: "entrada", valor: 300 }),
      lanc({ tipo: "saida", valor: 120 }),
      lanc({ tipo: "saida", valor: 30 }),
    ], setembro);
    expect(r).toEqual({ entradas: 300, saidas: 150, qtdLancamentos: 3 });
  });

  it("conta um lançamento do dia 1º no mês certo", () => {
    const r = resumoPeriodo([lanc({ dataCompetencia: "2026-09-01T00:00:00.000Z" })], setembro);
    expect(r.qtdLancamentos).toBe(1);
  });
});

describe("getIntervaloPeriodo personalizado", () => {
  const hoje = new Date(2026, 8, 15);

  it("usa as duas datas, com o dia final inteiro", () => {
    const { inicio, fim } = getIntervaloPeriodo("personalizado", hoje, "2026-08-01", "2026-08-31");
    expect(inicio).toEqual(new Date(2026, 7, 1));
    expect(fim).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
  });

  it("deixa em aberto o lado cujo campo está vazio", () => {
    expect(getIntervaloPeriodo("personalizado", hoje, "", "2026-08-31").inicio).toBeNull();
    expect(getIntervaloPeriodo("personalizado", hoje, "2026-08-01", "").fim).toBeNull();
  });

  it("todo o período não tem limites", () => {
    expect(getIntervaloPeriodo("todos", hoje)).toEqual({ inicio: null, fim: null });
  });
});

describe("filtrarPorIntervalo", () => {
  const hoje = new Date(2026, 8, 15);
  const julho = lanc({ id: 1, dataCompetencia: "2026-07-20T00:00:00.000Z" });
  const inicioAgosto = lanc({ id: 2, dataCompetencia: "2026-08-01T00:00:00.000Z" });
  const fimAgosto = lanc({ id: 3, dataCompetencia: "2026-08-31T00:00:00.000Z" });
  const setembroL = lanc({ id: 4, dataCompetencia: "2026-09-05T00:00:00.000Z" });
  const todos = [julho, inicioAgosto, fimAgosto, setembroL];
  const ids = (ls: Lancamento[]) => ls.map((l) => l.id);
  const filtrar = (de: string, ate: string) =>
    ids(filtrarPorIntervalo(todos, getIntervaloPeriodo("personalizado", hoje, de, ate)));

  it("entre duas datas inclui os dois dias dos limites", () => {
    expect(filtrar("2026-08-01", "2026-08-31")).toEqual([2, 3]);
  });

  it("só com a data final traz tudo até ela (antes de uma data)", () => {
    expect(filtrar("", "2026-08-01")).toEqual([1, 2]);
  });

  it("só com a data inicial traz tudo a partir dela", () => {
    expect(filtrar("2026-08-31", "")).toEqual([3, 4]);
  });

  it("sem datas traz tudo", () => {
    expect(filtrar("", "")).toEqual([1, 2, 3, 4]);
  });

  it("usa a data de pagamento quando não há competência", () => {
    const pago = lanc({ id: 5, dataCompetencia: null, dataPagamento: "2026-08-10T00:00:00.000Z" });
    const agosto = getIntervaloPeriodo("personalizado", hoje, "2026-08-01", "2026-08-31");
    expect(ids(filtrarPorIntervalo([pago], agosto))).toEqual([5]);
  });

  it("os totais do período somam só os lançamentos filtrados", () => {
    const r = resumoPeriodo([
      lanc({ tipo: "entrada", valor: 500, dataCompetencia: "2026-07-20T00:00:00.000Z" }),
      lanc({ tipo: "entrada", valor: 200, dataCompetencia: "2026-08-10T00:00:00.000Z" }),
      lanc({ tipo: "saida", valor: 80, dataCompetencia: "2026-08-12T00:00:00.000Z" }),
    ], getIntervaloPeriodo("personalizado", hoje, "2026-08-01", "2026-08-31"));
    expect(r).toEqual({ entradas: 200, saidas: 80, qtdLancamentos: 2 });
  });
});

describe("intervaloValido", () => {
  const hoje = new Date(2026, 8, 15);

  it("recusa data inicial depois da final", () => {
    expect(intervaloValido(getIntervaloPeriodo("personalizado", hoje, "2026-08-31", "2026-08-01"))).toBe(false);
  });

  it("aceita o mesmo dia e intervalos abertos", () => {
    expect(intervaloValido(getIntervaloPeriodo("personalizado", hoje, "2026-08-10", "2026-08-10"))).toBe(true);
    expect(intervaloValido(getIntervaloPeriodo("personalizado", hoje, "", "2026-08-10"))).toBe(true);
  });
});

describe("contasPendentes", () => {
  it("considera só lançamentos pendentes, separando vencidos e a vencer", () => {
    const hoje = new Date(2026, 8, 15);
    const { vencidas, vencendo } = contasPendentes([
      lanc({ situacao: "pendente", dataCompetencia: "2026-09-10T00:00:00.000Z", tipo: "saida" }),
      lanc({ situacao: "pendente", dataCompetencia: "2026-09-18T00:00:00.000Z", tipo: "entrada" }),
      lanc({ situacao: "pago", dataCompetencia: "2026-09-10T00:00:00.000Z" }),
    ], hoje);
    expect(vencidas).toHaveLength(1);
    expect(vencidas[0].tipo).toBe("pagar");
    expect(vencendo).toHaveLength(1);
    expect(vencendo[0].tipo).toBe("receber");
  });
});

describe("serieFluxoCaixa", () => {
  it("separa realizado (recebido/pago) do previsto (todos)", () => {
    const hoje = new Date(2026, 8, 20);
    const serie = serieFluxoCaixa([
      lanc({ tipo: "entrada", valor: 100, situacao: "recebido" }),
      lanc({ tipo: "entrada", valor: 50, situacao: "pendente" }),
      lanc({ tipo: "saida", valor: 40, situacao: "pago" }),
    ], 1, hoje);
    expect(serie[0]).toMatchObject({ realizado: 100, previsto: 150, saidasRealizado: 40, saidasPrevisto: 40 });
  });
});

describe("arvoreCategorias", () => {
  it("agrupa as subcategorias sob a categoria pai", () => {
    const categorias: Categoria[] = [
      { id: 1, nome: "Pessoal", tipo: "despesa", categoriaPaiId: null, ativa: true },
      { id: 2, nome: "Salários", tipo: "despesa", categoriaPaiId: 1, ativa: true },
      { id: 3, nome: "Doações", tipo: "receita", categoriaPaiId: null, ativa: true },
      { id: 4, nome: "Bolsas", tipo: "despesa", categoriaPaiId: 1, ativa: true },
    ];
    const arvore = arvoreCategorias(categorias);
    expect(arvore.map((c) => c.categoria.nome)).toEqual(["Pessoal", "Doações"]);
    expect(arvore[0].subcategorias.map((s) => s.nome)).toEqual(["Salários", "Bolsas"]);
    expect(arvore[1].subcategorias).toEqual([]);
  });
});

describe("execucaoOrcamentaria", () => {
  const projetos: Projeto[] = [
    { id: 1, organizacaoId: 1, nome: "Semear", descricao: null, status: "Em andamento", orcamentoTotal: null, dataInicio: null, dataFim: null },
  ];
  const categorias: Categoria[] = [
    { id: 10, nome: "Material", tipo: "despesa", categoriaPaiId: null, ativa: true },
    { id: 11, nome: "Transporte", tipo: "despesa", categoriaPaiId: null, ativa: true },
  ];
  const orcamentos: Orcamento[] = [
    { id: 1, projetoId: 1, categoriaId: 10, periodoReferencia: "2026", valorPrevisto: 1000 },
    { id: 2, projetoId: 1, categoriaId: 11, periodoReferencia: "2026", valorPrevisto: 500 },
  ];

  it("cruza orçado (orçamentos) com realizado (saídas pagas) por projeto e categoria", () => {
    const [p] = execucaoOrcamentaria(projetos, categorias, orcamentos, [
      lanc({ projetoId: 1, categoriaId: 10, tipo: "saida", valor: 300, situacao: "pago" }),
      lanc({ projetoId: 1, categoriaId: 10, tipo: "saida", valor: 999, situacao: "pendente" }),
      lanc({ projetoId: 1, categoriaId: 10, tipo: "entrada", valor: 999, situacao: "recebido" }),
    ]);
    expect(p).toMatchObject({ projetoId: 1, projeto: "Semear", orcado: 1500, realizado: 300 });
    expect(p.categorias).toEqual([
      { nome: "Material", orcado: 1000, realizado: 300 },
      { nome: "Transporte", orcado: 500, realizado: 0 },
    ]);
  });

  it("ignora projetos sem orçamento", () => {
    expect(execucaoOrcamentaria(projetos, categorias, [], [])).toEqual([]);
  });
});
