// Exportação dos relatórios em PDF (RF60). Cada relatório monta um
// `DocumentoPdf` (função pura e testada) e este módulo só o desenha com o
// jsPDF + jspdf-autotable, carregados apenas ao exportar.
//
// Layout: A4, cabeçalho com a organização, o título e os filtros na primeira
// página; cabeçalho resumido nas seguintes; rodapé com a emissão (RF59) e
// "Página X de Y" em todas.
import type { jsPDF } from "jspdf";
import { fmt } from "./format";
import { nomeArquivo, textoEmissao } from "./planilha";

/** Célula de tabela: número é formatado conforme a coluna; null fica "—". */
export type CelulaPdf = string | number | null;

export type FormatoColuna = "texto" | "dinheiro" | "percentual";

export interface ColunaPdf {
  titulo: string;
  formato?: FormatoColuna;
  /** Largura em mm; sem ela, o autotable distribui o espaço. */
  largura?: number;
}

export type TomIndicador = "neutro" | "positivo" | "negativo";

export interface IndicadorPdf {
  rotulo: string;
  valor: string;
  tom?: TomIndicador;
}

export interface CampoPdf {
  rotulo: string;
  valor: string;
}

export type BlocoPdf =
  | { tipo: "secao"; titulo: string }
  | { tipo: "paragrafo"; texto: string }
  /** Pares "rótulo: valor", ex.: os dados de identificação de um projeto. */
  | { tipo: "campos"; itens: CampoPdf[] }
  | { tipo: "indicadores"; itens: IndicadorPdf[] }
  | {
      tipo: "tabela";
      colunas: ColunaPdf[];
      linhas: CelulaPdf[][];
      totais?: CelulaPdf[];
      /** Índices das linhas destacadas em vermelho claro (ex.: categoria acima do orçado). */
      linhasEmAlerta?: number[];
      /** Texto mostrado quando não há linhas. */
      vazio?: string;
    }
  | { tipo: "notas"; titulo?: string; itens: string[] };

export interface DocumentoPdf {
  titulo: string;
  /** Nome da organização do usuário; sem ele, o cabeçalho omite a linha. */
  organizacao: string | null;
  /** Uma linha por filtro aplicado, ex.: "Período: novembro de 2026". */
  filtros: string[];
  usuario: string | null;
  geradoEm: Date;
  orientacao?: "retrato" | "paisagem";
  blocos: BlocoPdf[];
}

// ── Aparência ──────────────────────────────────────────────────────────────

const MARGEM = 15;
const MARGEM_INFERIOR = 18;
const COR_TEXTO: [number, number, number] = [15, 30, 61]; // #0f1e3d
const COR_SUAVE: [number, number, number] = [107, 122, 153]; // #6b7a99
const COR_BORDA: [number, number, number] = [212, 218, 231]; // #d4dae7
const COR_POSITIVO: [number, number, number] = [14, 126, 110]; // #0e7e6e
const COR_NEGATIVO: [number, number, number] = [220, 38, 38]; // #dc2626
const COR_FUNDO_CABECALHO: [number, number, number] = [15, 30, 61];
const COR_FUNDO_TOTAL: [number, number, number] = [237, 240, 245]; // #edf0f5
const COR_FUNDO_ALERTA: [number, number, number] = [254, 242, 242]; // #fef2f2
const INDICADORES_POR_LINHA = 3;

// ── Formatação (pura) ──────────────────────────────────────────────────────

/**
 * Texto seguro para a fonte padrão do PDF (WinAnsi). O Intl separa "R$" do
 * número com espaço não separável e pode usar o sinal de menos tipográfico,
 * que a fonte padrão não tem. Com espaço comum, o valor também pode ser
 * buscado e copiado do PDF normalmente.
 */
export function textoPdf(texto: string): string {
  return texto.replace(/[   ]/g, " ").replace(/−/g, "-");
}

export function dinheiroPdf(valor: number): string {
  return textoPdf(fmt(valor));
}

/** Conteúdo exibido de uma célula, conforme o formato da coluna. */
export function formatarCelula(valor: CelulaPdf, formato: FormatoColuna = "texto"): string {
  if (valor === null) return formato === "texto" ? "" : "—";
  if (typeof valor === "string") return textoPdf(valor);
  if (formato === "dinheiro") return dinheiroPdf(valor);
  if (formato === "percentual") return `${valor}%`;
  return String(valor);
}

/** Valor negativo em coluna numérica aparece em vermelho. */
function negativo(valor: CelulaPdf, formato: FormatoColuna | undefined): boolean {
  return typeof valor === "number" && valor < 0 && (formato === "dinheiro" || formato === "percentual");
}

// ── Desenho ────────────────────────────────────────────────────────────────

type AutoTable = typeof import("jspdf-autotable").default;

interface Contexto {
  doc: jsPDF;
  autoTable: AutoTable;
  documento: DocumentoPdf;
  y: number;
}

function larguraUtil(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - 2 * MARGEM;
}

function alturaPagina(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

/** Cabeçalho resumido das páginas seguintes à primeira. */
function cabecalhoContinuacao(doc: jsPDF, documento: DocumentoPdf): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COR_SUAVE);
  const partes = [documento.organizacao, documento.titulo].filter(Boolean).join(" · ");
  doc.text(textoPdf(partes), MARGEM, MARGEM);
  doc.setDrawColor(...COR_BORDA);
  doc.line(MARGEM, MARGEM + 2, MARGEM + larguraUtil(doc), MARGEM + 2);
  return MARGEM + 8;
}

function novaPagina(ctx: Contexto): void {
  ctx.doc.addPage();
  ctx.y = cabecalhoContinuacao(ctx.doc, ctx.documento);
}

/** Pula para a próxima página se não couber `altura` mm a partir de y. */
function garantirEspaco(ctx: Contexto, altura: number): void {
  if (ctx.y + altura > alturaPagina(ctx.doc) - MARGEM_INFERIOR) novaPagina(ctx);
}

function desenharCabecalho(ctx: Contexto): void {
  const { doc, documento } = ctx;
  let y = MARGEM + 2;
  if (documento.organizacao) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COR_SUAVE);
    doc.text(textoPdf(documento.organizacao), MARGEM, y);
    y += 7;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COR_TEXTO);
  const titulo = doc.splitTextToSize(textoPdf(documento.titulo), larguraUtil(doc)) as string[];
  doc.text(titulo, MARGEM, y);
  y += titulo.length * 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COR_SUAVE);
  for (const filtro of documento.filtros) {
    const linhas = doc.splitTextToSize(textoPdf(filtro), larguraUtil(doc)) as string[];
    doc.text(linhas, MARGEM, y);
    y += linhas.length * 4.5;
  }
  doc.setDrawColor(...COR_BORDA);
  doc.line(MARGEM, y, MARGEM + larguraUtil(doc), y);
  ctx.y = y + 7;
}

// Tabelas até este tamanho não são partidas entre páginas: se não couberem
// inteiras, vão (com o título da seção) para a página seguinte.
const LINHAS_TABELA_PEQUENA = 15;
const ALTURA_LINHA_ESTIMADA = 7;

/** Altura que um bloco precisa junto do título que o antecede. */
function alturaParaManterJunto(bloco: BlocoPdf | undefined): number {
  if (bloco?.tipo === "tabela" && bloco.linhas.length <= LINHAS_TABELA_PEQUENA) {
    const linhas = Math.max(bloco.linhas.length, 1) + 1 + (bloco.totais ? 1 : 0);
    return linhas * ALTURA_LINHA_ESTIMADA;
  }
  return 15;
}

function desenharSecao(ctx: Contexto, titulo: string, proximo?: BlocoPdf): void {
  // Título não fica sozinho no pé da página: exige espaço para o conteúdo que vem logo depois.
  garantirEspaco(ctx, 5 + alturaParaManterJunto(proximo));
  const { doc } = ctx;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COR_TEXTO);
  doc.text(textoPdf(titulo), MARGEM, ctx.y);
  ctx.y += 5;
}

function desenharParagrafo(ctx: Contexto, texto: string): void {
  const { doc } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COR_TEXTO);
  const linhas = doc.splitTextToSize(textoPdf(texto), larguraUtil(doc)) as string[];
  for (const linha of linhas) {
    garantirEspaco(ctx, 5);
    doc.text(linha, MARGEM, ctx.y);
    ctx.y += 4.5;
  }
  ctx.y += 3;
}

/** Rótulo em negrito à esquerda e valor à direita, sem bordas; o valor quebra em linhas. */
function desenharCampos(ctx: Contexto, itens: CampoPdf[]): void {
  const { doc, autoTable, documento } = ctx;
  garantirEspaco(ctx, 12);
  autoTable(doc, {
    startY: ctx.y,
    margin: { left: MARGEM, right: MARGEM, top: MARGEM + 8, bottom: MARGEM_INFERIOR },
    body: itens.map((c) => [textoPdf(c.rotulo), textoPdf(c.valor)]),
    theme: "plain",
    rowPageBreak: "avoid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: { top: 1, bottom: 1, left: 0, right: 2 }, textColor: COR_TEXTO, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold", textColor: COR_SUAVE } },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) cabecalhoContinuacao(doc, documento);
    },
  });
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? ctx.y;
  ctx.y = finalY + 6;
}

function corDoTom(tom: TomIndicador | undefined): [number, number, number] {
  if (tom === "positivo") return COR_POSITIVO;
  if (tom === "negativo") return COR_NEGATIVO;
  return COR_TEXTO;
}

function desenharIndicadores(ctx: Contexto, itens: IndicadorPdf[]): void {
  const { doc } = ctx;
  const espaco = 4;
  const largura = (larguraUtil(doc) - espaco * (INDICADORES_POR_LINHA - 1)) / INDICADORES_POR_LINHA;
  const altura = 17;
  for (let i = 0; i < itens.length; i += INDICADORES_POR_LINHA) {
    garantirEspaco(ctx, altura + espaco);
    itens.slice(i, i + INDICADORES_POR_LINHA).forEach((item, j) => {
      const x = MARGEM + j * (largura + espaco);
      doc.setDrawColor(...COR_BORDA);
      doc.roundedRect(x, ctx.y, largura, altura, 1.5, 1.5, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COR_SUAVE);
      doc.text(textoPdf(item.rotulo), x + 3.5, ctx.y + 6, { maxWidth: largura - 7 });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...corDoTom(item.tom));
      doc.text(textoPdf(item.valor), x + 3.5, ctx.y + 13);
    });
    ctx.y += altura + espaco;
  }
  ctx.y += 2;
}

function desenharTabela(ctx: Contexto, bloco: Extract<BlocoPdf, { tipo: "tabela" }>): void {
  const { doc, autoTable, documento } = ctx;
  const { colunas, linhas, totais, linhasEmAlerta = [], vazio } = bloco;
  const alerta = new Set(linhasEmAlerta);
  const formatoDe = (i: number) => colunas[i]?.formato ?? "texto";
  const alinhamento = (i: number) => (formatoDe(i) === "texto" ? "left" : "right");

  const corpo = linhas.length > 0
    ? linhas.map((linha) => linha.map((v, i) => formatarCelula(v, formatoDe(i))))
    : [[{ content: textoPdf(vazio ?? "Nenhum registro."), colSpan: colunas.length, styles: { halign: "center" as const, textColor: COR_SUAVE } }]];

  garantirEspaco(ctx, alturaParaManterJunto(bloco));
  autoTable(doc, {
    startY: ctx.y,
    margin: { left: MARGEM, right: MARGEM, top: MARGEM + 8, bottom: MARGEM_INFERIOR },
    head: [colunas.map((c) => textoPdf(c.titulo))],
    body: corpo,
    foot: totais ? [totais.map((v, i) => formatarCelula(v, formatoDe(i)))] : undefined,
    showHead: "everyPage",
    showFoot: "lastPage",
    rowPageBreak: "avoid",
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.8, valign: "middle", textColor: COR_TEXTO, lineColor: COR_BORDA, lineWidth: 0.1, overflow: "linebreak" },
    headStyles: { fillColor: COR_FUNDO_CABECALHO, textColor: [255, 255, 255], fontStyle: "bold" },
    footStyles: { fillColor: COR_FUNDO_TOTAL, textColor: COR_TEXTO, fontStyle: "bold" },
    columnStyles: Object.fromEntries(colunas.map((c, i) => [i, { halign: alinhamento(i), ...(c.largura ? { cellWidth: c.largura } : {}) }])),
    didParseCell: (data) => {
      const i = data.column.index;
      // O columnStyles só vale para o corpo: cabeçalho e totais seguem a coluna aqui.
      if (data.section !== "body") data.cell.styles.halign = alinhamento(i);
      if (linhas.length === 0) return;
      const origem = data.section === "body" ? linhas[data.row.index]?.[i] : data.section === "foot" ? totais?.[i] ?? null : null;
      if (data.section !== "head" && negativo(origem ?? null, formatoDe(i))) data.cell.styles.textColor = COR_NEGATIVO;
      if (data.section === "body" && alerta.has(data.row.index)) data.cell.styles.fillColor = COR_FUNDO_ALERTA;
    },
    // Páginas criadas pela própria tabela (a 2ª em diante dela) ganham o
    // cabeçalho resumido; a página em que ela começa já tem o seu.
    didDrawPage: (data) => {
      if (data.pageNumber > 1) cabecalhoContinuacao(doc, documento);
    },
  });
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? ctx.y;
  ctx.y = finalY + 8;
}

function desenharNotas(ctx: Contexto, itens: string[], titulo?: string): void {
  const { doc } = ctx;
  if (titulo) desenharSecao(ctx, titulo);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COR_SUAVE);
  for (const item of itens) {
    const linhas = doc.splitTextToSize(textoPdf(item), larguraUtil(doc) - 4) as string[];
    garantirEspaco(ctx, linhas.length * 4 + 1);
    doc.text("•", MARGEM, ctx.y);
    doc.text(linhas, MARGEM + 4, ctx.y);
    ctx.y += linhas.length * 4 + 1;
  }
  ctx.y += 3;
}

/** Rodapé de todas as páginas, desenhado no fim para saber o total. */
function desenharRodapes(doc: jsPDF, documento: DocumentoPdf): void {
  const total = doc.getNumberOfPages();
  const emissao = textoPdf(textoEmissao(documento.geradoEm, documento.usuario));
  const yRodape = alturaPagina(doc) - 9;
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(...COR_BORDA);
    doc.line(MARGEM, yRodape - 4, MARGEM + larguraUtil(doc), yRodape - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COR_SUAVE);
    doc.text(emissao, MARGEM, yRodape);
    doc.text(`Página ${pagina} de ${total}`, MARGEM + larguraUtil(doc), yRodape, { align: "right" });
  }
}

/** Desenha o documento num jsPDF novo. Separado do download para ser testável. */
export async function gerarPdf(documento: DocumentoPdf, opcoes: { comprimir?: boolean } = {}): Promise<jsPDF> {
  // Carregadas só ao exportar, para não pesar a abertura das telas.
  const [{ jsPDF: JsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new JsPDF({
    orientation: documento.orientacao === "paisagem" ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
    compress: opcoes.comprimir ?? true,
  });
  doc.setProperties({ title: textoPdf(documento.titulo), author: textoPdf(documento.organizacao ?? ""), creator: "MDCA" });

  const ctx: Contexto = { doc, autoTable, documento, y: MARGEM };
  desenharCabecalho(ctx);
  documento.blocos.forEach((bloco, i) => {
    if (bloco.tipo === "secao") desenharSecao(ctx, bloco.titulo, documento.blocos[i + 1]);
    else if (bloco.tipo === "paragrafo") desenharParagrafo(ctx, bloco.texto);
    else if (bloco.tipo === "campos") desenharCampos(ctx, bloco.itens);
    else if (bloco.tipo === "indicadores") desenharIndicadores(ctx, bloco.itens);
    else if (bloco.tipo === "tabela") desenharTabela(ctx, bloco);
    else desenharNotas(ctx, bloco.itens, bloco.titulo);
  });
  desenharRodapes(doc, documento);
  return doc;
}

/** Gera o PDF e dispara o download no navegador. */
export async function baixarPdf(documento: DocumentoPdf): Promise<void> {
  const doc = await gerarPdf(documento);
  doc.save(nomeArquivo(documento.titulo, documento.geradoEm, "pdf"));
}
