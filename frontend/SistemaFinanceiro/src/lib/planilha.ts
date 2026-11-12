// Exportação dos relatórios em planilha Excel (.xlsx), RF56. A montagem das
// linhas é pura e testada; `baixarPlanilha` só entrega o arquivo ao navegador.
import type { Cell, CellObject, SheetData } from "write-excel-file/browser";
import { formatData } from "./format";

/** Célula de entrada: número vira dinheiro, texto fica como texto, null fica vazio. */
export type ValorCelula = string | number | null;

export interface DadosPlanilha {
  titulo: string;
  /** Uma linha por filtro aplicado, ex.: "Período: 01/09/2026 a 30/09/2026". */
  filtros: string[];
  usuario: string | null;
  geradoEm: Date;
  colunas: string[];
  linhas: ValorCelula[][];
  totais?: ValorCelula[];
}

const FORMATO_DINHEIRO = "#,##0.00";

function celula(valor: ValorCelula, negrito = false): Cell {
  if (valor === null) return null;
  const base: CellObject =
    typeof valor === "number"
      ? { value: valor, type: Number, format: FORMATO_DINHEIRO }
      : { value: valor, type: String };
  return negrito ? { ...base, fontWeight: "bold" } : base;
}

function horaMinuto(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Linhas da planilha: título, filtros, data/hora e autor da emissão (RF59),
 * uma linha em branco, a tabela e, se houver, a linha de totais.
 */
export function planilhaComCabecalho(dados: DadosPlanilha): SheetData {
  const emissao = `Gerado em ${formatData(dados.geradoEm)} ${horaMinuto(dados.geradoEm)}${dados.usuario ? ` por ${dados.usuario}` : ""}`;
  return [
    [{ value: dados.titulo, fontWeight: "bold" }],
    ...dados.filtros.map((f) => [{ value: f }]),
    [{ value: emissao }],
    [],
    dados.colunas.map((c) => ({ value: c, fontWeight: "bold" as const })),
    ...dados.linhas.map((linha) => linha.map((v) => celula(v))),
    ...(dados.totais ? [dados.totais.map((v) => celula(v, true))] : []),
  ];
}

/** "Fluxo de Caixa" + 05/11/2026 → "fluxo-de-caixa-2026-11-05.xlsx". */
export function nomeArquivo(nome: string, data: Date): string {
  const base = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const dia = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
  return `${base}-${dia}.xlsx`;
}

/** Gera o .xlsx e dispara o download no navegador. */
export async function baixarPlanilha(dados: DadosPlanilha, larguras: number[]): Promise<void> {
  // Carregada só ao exportar, para não pesar a abertura das telas.
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  await writeExcelFile(planilhaComCabecalho(dados), { columns: larguras.map((width) => ({ width })) })
    .toFile(nomeArquivo(dados.titulo, dados.geradoEm));
}
