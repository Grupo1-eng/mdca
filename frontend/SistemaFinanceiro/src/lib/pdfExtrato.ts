// Documento PDF do extrato financeiro (RF07, RF60). Função pura: recebe os
// lançamentos já filtrados pela tela (`filtrarExtrato`) e monta o
// `DocumentoPdf` que `lib/pdf.ts` desenha, em A4 paisagem pela quantidade de colunas.
import type { Categoria, Lancamento } from "@/types/financeiro";
import { dataDoLancamento } from "./aggregations";
import { formatDate } from "./format";
import { dinheiroPdf, type DocumentoPdf, type TomIndicador } from "./pdf";
import { nomesCompletosDeCategoria, totaisPorCategoria } from "./relatorios";
import { rotuloSituacao } from "./rotulos";

export interface EntradaPdfExtrato {
  /** Lançamentos já filtrados, como aparecem na tela. */
  lancamentos: Lancamento[];
  categorias: Categoria[];
  nomeProjeto: Map<number, string>;
  nomeConta: Map<number, string>;
  nomeContato: Map<number, string>;
  /** Filtros aplicados, uma linha cada (ex.: "Período: novembro de 2026"). */
  filtros: string[];
  organizacao: string | null;
  usuario: string | null;
  geradoEm: Date;
}

/** Evita resíduo de ponto flutuante (0,1 + 0,2) nas somas. */
function somar(valores: number[]): number {
  return Math.round(valores.reduce((a, b) => a + b, 0) * 100) / 100;
}

function tomDoResultado(valor: number): TomIndicador {
  return valor < 0 ? "negativo" : "neutro";
}

/** Ordem de extrato: da data mais antiga para a mais recente; empate pela ordem de cadastro. */
function emOrdemCronologica(lancamentos: Lancamento[]): Lancamento[] {
  return [...lancamentos].sort((a, b) =>
    dataDoLancamento(a).slice(0, 10).localeCompare(dataDoLancamento(b).slice(0, 10)) || a.id - b.id,
  );
}

export function documentoExtratoPdf(entrada: EntradaPdfExtrato): DocumentoPdf {
  const { categorias, nomeProjeto, nomeConta, nomeContato, filtros, organizacao, usuario, geradoEm } = entrada;
  const lancamentos = emOrdemCronologica(entrada.lancamentos);
  const nomeCategoria = nomesCompletosDeCategoria(categorias);

  const valores = (tipo: Lancamento["tipo"], realizado: boolean) =>
    lancamentos.filter((l) => l.tipo === tipo && (l.situacao !== "pendente") === realizado).map((l) => l.valor);
  const recebidas = somar(valores("entrada", true));
  const aReceber = somar(valores("entrada", false));
  const pagas = somar(valores("saida", true));
  const aPagar = somar(valores("saida", false));
  const resultadoRealizado = somar([recebidas, -pagas]);
  const resultadoPrevisto = somar([recebidas, aReceber, -pagas, -aPagar]);

  const quantidade = `${lancamentos.length} ${lancamentos.length === 1 ? "lançamento" : "lançamentos"}`;

  return {
    titulo: "Extrato Financeiro",
    organizacao,
    filtros,
    usuario,
    geradoEm,
    orientacao: "paisagem",
    blocos: [
      { tipo: "secao", titulo: "Resumo" },
      {
        tipo: "indicadores",
        itens: [
          { rotulo: "Entradas recebidas", valor: dinheiroPdf(recebidas), tom: "positivo" },
          { rotulo: "Saídas pagas", valor: dinheiroPdf(pagas), tom: "negativo" },
          { rotulo: "Resultado realizado", valor: dinheiroPdf(resultadoRealizado), tom: tomDoResultado(resultadoRealizado) },
          { rotulo: "Entradas a receber", valor: dinheiroPdf(aReceber) },
          { rotulo: "Saídas a pagar", valor: dinheiroPdf(aPagar) },
          { rotulo: "Resultado previsto", valor: dinheiroPdf(resultadoPrevisto), tom: tomDoResultado(resultadoPrevisto) },
        ],
      },
      { tipo: "secao", titulo: `Lançamentos (${quantidade})` },
      {
        tipo: "tabela",
        colunas: [
          { titulo: "Data", largura: 19 },
          { titulo: "Descrição" },
          { titulo: "Projeto", largura: 30 },
          { titulo: "Conta", largura: 31 },
          { titulo: "Categoria", largura: 34 },
          { titulo: "Favorecido / Origem", largura: 37 },
          { titulo: "Situação", largura: 17 },
          { titulo: "Entrada", formato: "dinheiro", largura: 26 },
          { titulo: "Saída", formato: "dinheiro", largura: 26 },
        ],
        linhas: lancamentos.map((l) => [
          formatDate(dataDoLancamento(l)),
          l.descricao ?? "",
          l.projetoId !== null ? nomeProjeto.get(l.projetoId) ?? "" : "",
          nomeConta.get(l.contaId) ?? "",
          nomeCategoria.get(l.categoriaId) ?? `Categoria ${l.categoriaId}`,
          l.contatoId !== null ? nomeContato.get(l.contatoId) ?? "" : "",
          rotuloSituacao[l.situacao],
          // Lado vazio em branco (não "—"), como na tela: cada linha tem só um valor.
          l.tipo === "entrada" ? l.valor : "",
          l.tipo === "saida" ? l.valor : "",
        ]),
        // Soma de cada coluna, realizados e pendentes; o resumo acima separa os dois.
        totais: ["Total", quantidade, null, null, null, null, null, somar([recebidas, aReceber]), somar([pagas, aPagar])],
        vazio: "Nenhum lançamento com os filtros selecionados.",
      },
      { tipo: "secao", titulo: "Totais por categoria" },
      {
        tipo: "tabela",
        colunas: [
          { titulo: "Categoria" },
          { titulo: "Entradas", formato: "dinheiro", largura: 40 },
          { titulo: "Saídas", formato: "dinheiro", largura: 40 },
        ],
        linhas: totaisPorCategoria(lancamentos, categorias)
          .sort((a, b) => a.categoria.localeCompare(b.categoria, "pt-BR"))
          .map((c) => [c.categoria, c.entradas ? somar([c.entradas]) : null, c.saidas ? somar([c.saidas]) : null]),
        totais: ["Total", somar([recebidas, aReceber]), somar([pagas, aPagar])],
        vazio: "Nenhum lançamento com os filtros selecionados.",
      },
    ],
  };
}
