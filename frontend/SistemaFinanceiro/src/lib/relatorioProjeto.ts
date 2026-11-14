// Relatório de execução orçamentária de um projeto (US-16). Função pura sobre as
// listas já carregadas pelos hooks, no mesmo padrão de `lib/relatorios.ts`.
//
// Regras:
// - Só o que já aconteceu conta: entrada "recebido" e saída "pago". Pendente não entra.
// - Orçado: soma dos orçamentos cadastrados para o projeto, por categoria. O
//   `periodoReferencia` do orçamento é texto livre, então o orçado NÃO é recortado
//   pelo período; só os lançamentos (realizado, entradas e saídas) são.
// - Origem de entrada e de saída: o contato do lançamento. Lançamento sem contato
//   fica em "Sem origem informada" (ainda não há vínculo com fonte de recurso).
// - Saldo do projeto: entradas recebidas − saídas pagas dos lançamentos dele. A conta
//   financeira não pertence a projeto, então não existe "saldo em conta" por projeto.
import type { Categoria, Contato, Lancamento, Orcamento, Projeto } from "@/types/financeiro";
import { filtrarPorIntervalo, type Intervalo } from "./aggregations";

export const SEM_ORIGEM = "Sem origem informada";

export interface MovimentoPorOrigem {
  /** `null` agrupa os lançamentos sem contato. */
  contatoId: number | null;
  origem: string;
  valor: number;
}

export interface LinhaCategoria {
  categoriaId: number;
  /** "Pessoal › Salários" para subcategoria; só o nome para categoria principal. */
  categoria: string;
  orcado: number;
  realizado: number;
  /** orçado − realizado; negativo quando passou do orçado. */
  diferenca: number;
  /** Realizado sobre orçado, arredondado; `null` quando não há orçado. */
  percentual: number | null;
  /** Realizado maior que o orçado (inclui gasto em categoria sem orçamento). */
  estourada: boolean;
}

export interface RelatorioProjeto {
  projetoId: number;
  nome: string;
  descricao: string | null;
  status: string;
  totalEntradas: number;
  totalSaidas: number;
  /** Entradas recebidas − saídas pagas. */
  saldo: number;
  totalOrcado: number;
  /** Mesmo valor das saídas pagas: todo lançamento tem categoria. */
  totalRealizado: number;
  totalDiferenca: number;
  percentualExecucao: number | null;
  entradasPorOrigem: MovimentoPorOrigem[];
  saidasPorOrigem: MovimentoPorOrigem[];
  categorias: LinhaCategoria[];
}

export interface EntradaRelatorioProjeto {
  projeto: Projeto;
  categorias: Categoria[];
  orcamentos: Orcamento[];
  lancamentos: Lancamento[];
  contatos: Contato[];
  intervalo: Intervalo;
}

/** Evita resíduo de ponto flutuante (0,1 + 0,2) nos totais em reais. */
function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function somar(valores: number[]): number {
  return arredondar(valores.reduce((a, b) => a + b, 0));
}

function percentual(realizado: number, orcado: number): number | null {
  return orcado > 0 ? Math.round((realizado / orcado) * 100) : null;
}

function nomeDaCategoria(id: number, porId: Map<number, Categoria>): string {
  const categoria = porId.get(id);
  if (!categoria) return `Categoria ${id}`;
  const pai = categoria.categoriaPaiId !== null ? porId.get(categoria.categoriaPaiId) : undefined;
  return pai ? `${pai.nome} › ${categoria.nome}` : categoria.nome;
}

/** Soma por contato, do maior valor para o menor; sem contato vai para "Sem origem informada". */
function agruparPorOrigem(lancamentos: Lancamento[], nomeContato: Map<number, string>): MovimentoPorOrigem[] {
  const porContato = new Map<number | null, number>();
  for (const l of lancamentos) {
    porContato.set(l.contatoId, (porContato.get(l.contatoId) ?? 0) + l.valor);
  }
  return [...porContato.entries()]
    .map(([contatoId, valor]) => ({
      contatoId,
      origem: contatoId === null ? SEM_ORIGEM : nomeContato.get(contatoId) ?? `Contato ${contatoId}`,
      valor: arredondar(valor),
    }))
    .sort((a, b) => b.valor - a.valor || a.origem.localeCompare(b.origem, "pt-BR"));
}

export function relatorioExecucaoProjeto(entrada: EntradaRelatorioProjeto): RelatorioProjeto {
  const { projeto, categorias, orcamentos, lancamentos, contatos, intervalo } = entrada;

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));
  const nomeContato = new Map(contatos.map((c) => [c.id, c.nome]));

  const doProjeto = filtrarPorIntervalo(
    lancamentos.filter((l) => l.projetoId === projeto.id),
    intervalo,
  );
  const entradas = doProjeto.filter((l) => l.tipo === "entrada" && l.situacao === "recebido");
  const saidas = doProjeto.filter((l) => l.tipo === "saida" && l.situacao === "pago");
  const orcamentosDoProjeto = orcamentos.filter((o) => o.projetoId === projeto.id);

  // Categorias do relatório: as que têm orçamento e as que só têm gasto, para o
  // realizado total bater com as saídas pagas.
  const categoriaIds = new Set<number>([
    ...orcamentosDoProjeto.map((o) => o.categoriaId),
    ...saidas.map((l) => l.categoriaId),
  ]);

  const linhas: LinhaCategoria[] = [...categoriaIds]
    .map((categoriaId) => {
      const orcado = somar(orcamentosDoProjeto.filter((o) => o.categoriaId === categoriaId).map((o) => o.valorPrevisto));
      const realizado = somar(saidas.filter((l) => l.categoriaId === categoriaId).map((l) => l.valor));
      return {
        categoriaId,
        categoria: nomeDaCategoria(categoriaId, categoriaPorId),
        orcado,
        realizado,
        diferenca: arredondar(orcado - realizado),
        percentual: percentual(realizado, orcado),
        estourada: realizado > orcado,
      };
    })
    .sort((a, b) => a.categoria.localeCompare(b.categoria, "pt-BR"));

  const totalEntradas = somar(entradas.map((l) => l.valor));
  const totalSaidas = somar(saidas.map((l) => l.valor));
  const totalOrcado = somar(linhas.map((l) => l.orcado));
  const totalRealizado = somar(linhas.map((l) => l.realizado));

  return {
    projetoId: projeto.id,
    nome: projeto.nome,
    descricao: projeto.descricao,
    status: projeto.status,
    totalEntradas,
    totalSaidas,
    saldo: arredondar(totalEntradas - totalSaidas),
    totalOrcado,
    totalRealizado,
    totalDiferenca: arredondar(totalOrcado - totalRealizado),
    percentualExecucao: percentual(totalRealizado, totalOrcado),
    entradasPorOrigem: agruparPorOrigem(entradas, nomeContato),
    saidasPorOrigem: agruparPorOrigem(saidas, nomeContato),
    categorias: linhas,
  };
}