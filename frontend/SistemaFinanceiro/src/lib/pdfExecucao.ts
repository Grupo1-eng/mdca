// Documento PDF do relatório de execução orçamentária de um projeto (US-16,
// RF60). Função pura: recebe o relatório já calculado por
// `relatorioExecucaoProjeto` e monta o `DocumentoPdf` que `lib/pdf.ts` desenha.
// Os números são os mesmos da tela; aqui só se decide o que aparece e como.
import type { Projeto } from "@/types/financeiro";
import { formatDate } from "./format";
import { dinheiroPdf, type BlocoPdf, type CelulaPdf, type DocumentoPdf, type TomIndicador } from "./pdf";
import type { LinhaCategoria, MovimentoPorOrigem, RelatorioProjeto } from "./relatorioProjeto";

const TIPOS_PROJETO: Record<string, string> = {
  PROJETO: "Projeto",
  SERVICO: "Serviço",
  PROGRAMA: "Programa",
};

export interface EntradaPdfExecucao {
  relatorio: RelatorioProjeto;
  projeto: Projeto;
  /** Período escolhido na tela, já por extenso (ex.: "novembro de 2026"). */
  periodo: string;
  organizacao: string | null;
  usuario: string | null;
  geradoEm: Date;
}

function tomDoSaldo(valor: number): TomIndicador {
  return valor < 0 ? "negativo" : "neutro";
}

/** "Acima do orçado" / "Sem orçamento": o alerta vai em texto, não só na cor (impressão em P&B). */
function situacaoDaCategoria(c: LinhaCategoria): string {
  if (!c.estourada) return "";
  return c.orcado === 0 ? "Sem orçamento" : "Acima do orçado";
}

function vigencia(projeto: Projeto): string {
  const { dataInicio, dataFim } = projeto;
  if (!dataInicio && !dataFim) return "Não informada";
  if (!dataFim) return `A partir de ${formatDate(dataInicio)}`;
  if (!dataInicio) return `Até ${formatDate(dataFim)}`;
  return `${formatDate(dataInicio)} a ${formatDate(dataFim)}`;
}

function tabelaOrigem(itens: MovimentoPorOrigem[], total: number): BlocoPdf {
  return {
    tipo: "tabela",
    colunas: [{ titulo: "Origem" }, { titulo: "Valor", formato: "dinheiro", largura: 34 }, { titulo: "% do total", formato: "percentual", largura: 24 }],
    linhas: itens.map((i) => [i.origem, i.valor, total > 0 ? Math.round((i.valor / total) * 100) : null]),
    totais: ["Total", total, itens.length > 0 ? 100 : null],
    vazio: "Nenhum lançamento no período.",
  };
}

export function documentoExecucaoPdf(entrada: EntradaPdfExecucao): DocumentoPdf {
  const { relatorio: r, projeto, periodo, organizacao, usuario, geradoEm } = entrada;

  const linhasCategoria: CelulaPdf[][] = r.categorias.map((c) => [
    c.categoria, c.orcado, c.realizado, c.diferenca, c.percentual, situacaoDaCategoria(c),
  ]);
  const emAlerta = r.categorias.flatMap((c, i) => (c.estourada ? [i] : []));

  return {
    titulo: `Execução Orçamentária — ${r.nome}`,
    organizacao,
    filtros: [`Período dos lançamentos: ${periodo}`],
    usuario,
    geradoEm,
    blocos: [
      { tipo: "secao", titulo: "Identificação" },
      {
        tipo: "campos",
        itens: [
          { rotulo: "Nome", valor: r.nome },
          { rotulo: "Tipo", valor: TIPOS_PROJETO[projeto.tipo] ?? projeto.tipo },
          { rotulo: "Situação", valor: r.status },
          { rotulo: "Vigência", valor: vigencia(projeto) },
          { rotulo: "Orçamento total", valor: projeto.orcamentoTotal !== null ? dinheiroPdf(projeto.orcamentoTotal) : "Não informado" },
          { rotulo: "Descrição", valor: r.descricao || "Sem descrição." },
        ],
      },
      { tipo: "secao", titulo: "Resumo" },
      {
        tipo: "indicadores",
        itens: [
          { rotulo: "Orçado", valor: dinheiroPdf(r.totalOrcado) },
          { rotulo: "Realizado (saídas pagas)", valor: dinheiroPdf(r.totalRealizado) },
          { rotulo: "Executado", valor: r.percentualExecucao === null ? "—" : `${r.percentualExecucao}%`, tom: (r.percentualExecucao ?? 0) > 100 ? "negativo" : "neutro" },
          { rotulo: "Saldo a executar", valor: dinheiroPdf(r.totalDiferenca), tom: tomDoSaldo(r.totalDiferenca) },
          { rotulo: "Entradas recebidas", valor: dinheiroPdf(r.totalEntradas), tom: "positivo" },
          { rotulo: "Saldo do projeto", valor: dinheiroPdf(r.saldo), tom: tomDoSaldo(r.saldo) },
        ],
      },
      { tipo: "secao", titulo: "Orçado x realizado por categoria" },
      {
        tipo: "tabela",
        colunas: [
          { titulo: "Categoria" },
          { titulo: "Orçado", formato: "dinheiro", largura: 27 },
          { titulo: "Realizado", formato: "dinheiro", largura: 27 },
          { titulo: "Diferença", formato: "dinheiro", largura: 27 },
          { titulo: "Execução", formato: "percentual", largura: 19 },
          { titulo: "Situação", largura: 27 },
        ],
        linhas: linhasCategoria,
        totais: ["Total", r.totalOrcado, r.totalRealizado, r.totalDiferenca, r.percentualExecucao, null],
        linhasEmAlerta: emAlerta,
        vazio: "Este projeto não tem orçamento cadastrado nem saídas pagas no período.",
      },
      { tipo: "secao", titulo: "Entradas por origem" },
      tabelaOrigem(r.entradasPorOrigem, r.totalEntradas),
      { tipo: "secao", titulo: "Saídas por origem" },
      tabelaOrigem(r.saidasPorOrigem, r.totalSaidas),
    ],
  };
}
