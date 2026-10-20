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
  serieFluxoCaixaPeriodo,
  serieFluxoPeriodo,
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

describe("serieFluxoPeriodo", () => {
  const hoje = new Date(2026, 8, 15);
  const periodo = (de: string, ate: string) => getIntervaloPeriodo("personalizado", hoje, de, ate);

  it("agrupa por semana em períodos curtos, com semanas vazias zeradas", () => {
    const { agrupamento, pontos } = serieFluxoPeriodo([
      lanc({ tipo: "entrada", valor: 100, dataCompetencia: "2026-08-01T00:00:00.000Z" }),
      lanc({ tipo: "saida", valor: 40, dataCompetencia: "2026-08-07T00:00:00.000Z" }),
      lanc({ tipo: "entrada", valor: 50, dataCompetencia: "2026-08-20T00:00:00.000Z" }),
    ], periodo("2026-08-01", "2026-08-31"));
    expect(agrupamento).toBe("semana");
    expect(pontos.map((p) => p.label)).toEqual(["01/08", "08/08", "15/08", "22/08", "29/08"]);
    expect(pontos[0]).toMatchObject({ entradas: 100, saidas: 40 });
    expect(pontos[1]).toMatchObject({ entradas: 0, saidas: 0 });
    expect(pontos[2]).toMatchObject({ entradas: 50, saidas: 0 });
  });

  it("agrupa por mês em períodos de até 2 anos", () => {
    const { agrupamento, pontos } = serieFluxoPeriodo([
      lanc({ tipo: "entrada", valor: 100, dataCompetencia: "2026-01-31T00:00:00.000Z" }),
      lanc({ tipo: "saida", valor: 30, dataCompetencia: "2026-03-01T00:00:00.000Z" }),
    ], periodo("2026-01-01", "2026-03-31"));
    expect(agrupamento).toBe("mes");
    expect(pontos.map((p) => [p.entradas, p.saidas])).toEqual([[100, 0], [0, 0], [0, 30]]);
  });

  it("agrupa por ano acima de 2 anos", () => {
    const { agrupamento, pontos } = serieFluxoPeriodo([
      lanc({ valor: 10, dataCompetencia: "2022-05-10T00:00:00.000Z" }),
      lanc({ valor: 20, dataCompetencia: "2026-02-10T00:00:00.000Z" }),
    ], getIntervaloPeriodo("todos", hoje));
    expect(agrupamento).toBe("ano");
    expect(pontos.map((p) => p.label)).toEqual(["2022", "2023", "2024", "2025", "2026"]);
  });

  it("ignora lançamentos fora do período e devolve vazio quando não há nenhum", () => {
    const fora = [lanc({ dataCompetencia: "2026-07-20T00:00:00.000Z" })];
    expect(serieFluxoPeriodo(fora, periodo("2026-08-01", "2026-08-31")).pontos).toEqual([]);
  });

  it("com o início em aberto, começa no lançamento mais antigo", () => {
    const { pontos } = serieFluxoPeriodo([
      lanc({ valor: 10, dataCompetencia: "2026-08-10T00:00:00.000Z" }),
      lanc({ valor: 20, dataCompetencia: "2026-08-12T00:00:00.000Z" }),
    ], periodo("", "2026-08-16"));
    expect(pontos.map((p) => p.label)).toEqual(["10/08"]);
    expect(pontos[0].entradas).toBe(30);
  });
});

describe("serieFluxoCaixaPeriodo", () => {
  const hoje = new Date(2026, 8, 15);
  const periodo = (de: string, ate: string) => getIntervaloPeriodo("personalizado", hoje, de, ate);

  it("separa realizado e previsto em cada grupo do período", () => {
    const { agrupamento, pontos } = serieFluxoCaixaPeriodo([
      lanc({ tipo: "entrada", valor: 300, situacao: "recebido", dataCompetencia: "2026-07-05T00:00:00.000Z" }),
      lanc({ tipo: "entrada", valor: 200, situacao: "pendente", dataCompetencia: "2026-07-20T00:00:00.000Z" }),
      lanc({ tipo: "saida", valor: 50, situacao: "pago", dataCompetencia: "2026-09-02T00:00:00.000Z" }),
      lanc({ tipo: "saida", valor: 25, situacao: "pendente", dataCompetencia: "2026-09-03T00:00:00.000Z" }),
    ], periodo("2026-07-01", "2026-09-30"));
    expect(agrupamento).toBe("mes");
    expect(pontos).toHaveLength(3);
    expect(pontos[0]).toMatchObject({ realizado: 300, previsto: 500, saidasRealizado: 0, saidasPrevisto: 0 });
    expect(pontos[1]).toMatchObject({ realizado: 0, previsto: 0 });
    expect(pontos[2]).toMatchObject({ realizado: 0, previsto: 0, saidasRealizado: 50, saidasPrevisto: 75 });
  });

  it("agrupa como o gráfico do Financeiro e ignora o que está fora do período", () => {
    const lancamentos = [
      lanc({ valor: 100, dataCompetencia: "2026-08-03T00:00:00.000Z" }),
      lanc({ valor: 999, dataCompetencia: "2026-06-01T00:00:00.000Z" }),
    ];
    const agosto = periodo("2026-08-01", "2026-08-31");
    const caixa = serieFluxoCaixaPeriodo(lancamentos, agosto);
    const fluxo = serieFluxoPeriodo(lancamentos, agosto);
    expect(caixa.agrupamento).toBe(fluxo.agrupamento);
    expect(caixa.pontos.map((p) => p.label)).toEqual(fluxo.pontos.map((p) => p.label));
    expect(caixa.pontos.reduce((a, p) => a + p.previsto, 0)).toBe(100);
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
