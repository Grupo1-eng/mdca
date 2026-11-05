// Filtros e totais dos relatórios (RF07, RF29, RF56). Funções puras sobre as
// listas já carregadas pelos hooks.
import type { Categoria, Lancamento } from "@/types/financeiro";
import { filtrarPorIntervalo, filtrarPorTipo, type FiltroTipo, type Intervalo, type PontoFluxoCaixaPeriodo } from "./aggregations";

export interface FiltroExtrato {
  intervalo: Intervalo;
  projetoId: number | null;
  categoriaId: number | null;
  tipo: FiltroTipo;
  termo: string;
}

/** Ids aceitos pelo filtro de categoria: a principal leva junto as subcategorias. `null` = sem filtro. */
export function categoriasDoFiltro(categorias: Categoria[], categoriaId: number | null): Set<number> | null {
  if (categoriaId === null) return null;
  return new Set([categoriaId, ...categorias.filter((c) => c.categoriaPaiId === categoriaId).map((c) => c.id)]);
}

/** Lançamentos do extrato: período, projeto, categoria, tipo e busca por descrição ou projeto. */
export function filtrarExtrato(
  lancamentos: Lancamento[],
  filtro: FiltroExtrato,
  categorias: Categoria[],
  nomeProjeto: Map<number, string>,
): Lancamento[] {
  const aceitas = categoriasDoFiltro(categorias, filtro.categoriaId);
  const termo = filtro.termo.trim().toLowerCase();
  return filtrarPorTipo(filtrarPorIntervalo(lancamentos, filtro.intervalo), filtro.tipo).filter((l) => {
    if (filtro.projetoId !== null && l.projetoId !== filtro.projetoId) return false;
    if (aceitas && !aceitas.has(l.categoriaId)) return false;
    if (!termo) return true;
    const projeto = l.projetoId ? nomeProjeto.get(l.projetoId) ?? "" : "";
    return (l.descricao ?? "").toLowerCase().includes(termo) || projeto.toLowerCase().includes(termo);
  });
}

/** "Pessoal › Salários" para subcategoria; só o nome para categoria principal. */
function nomeCompleto(categoria: Categoria | undefined, porId: Map<number, Categoria>, id: number): string {
  if (!categoria) return `Categoria ${id}`;
  const pai = categoria.categoriaPaiId !== null ? porId.get(categoria.categoriaPaiId) : undefined;
  return pai ? `${pai.nome} › ${categoria.nome}` : categoria.nome;
}

export interface TotalCategoria {
  categoria: string;
  entradas: number;
  saidas: number;
}

/** Entradas e saídas por categoria, na ordem em que cada categoria aparece primeiro. */
export function totaisPorCategoria(lancamentos: Lancamento[], categorias: Categoria[]): TotalCategoria[] {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const totais = new Map<number, TotalCategoria>();
  for (const l of lancamentos) {
    let total = totais.get(l.categoriaId);
    if (!total) {
      total = { categoria: nomeCompleto(porId.get(l.categoriaId), porId, l.categoriaId), entradas: 0, saidas: 0 };
      totais.set(l.categoriaId, total);
    }
    if (l.tipo === "entrada") total.entradas += l.valor;
    else total.saidas += l.valor;
  }
  return [...totais.values()];
}

export interface TotaisFluxo {
  entradasPrevistas: number;
  entradasRealizadas: number;
  saidasPrevistas: number;
  saidasRealizadas: number;
  saldoRealizado: number;
}

/** Soma das colunas da série de fluxo de caixa do período. */
export function totaisFluxo(pontos: PontoFluxoCaixaPeriodo[]): TotaisFluxo {
  const soma = (campo: keyof Omit<PontoFluxoCaixaPeriodo, "label">) => pontos.reduce((a, p) => a + p[campo], 0);
  const entradasRealizadas = soma("realizado");
  const saidasRealizadas = soma("saidasRealizado");
  return {
    entradasPrevistas: soma("previsto"),
    entradasRealizadas,
    saidasPrevistas: soma("saidasPrevisto"),
    saidasRealizadas,
    saldoRealizado: entradasRealizadas - saidasRealizadas,
  };
}
