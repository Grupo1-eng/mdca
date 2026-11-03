export const fmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// O backend devolve datas como ISO completo ("2026-09-24T00:00:00.000Z") e
// guarda a data escolhida no formulário como meia-noite UTC. Só a parte
// YYYY-MM-DD importa: lida com `new Date(iso)` num fuso como UTC-3, ela
// cairia no dia anterior.
function parteData(iso: string): string {
  return iso.slice(0, 10);
}

/** Data do backend como Date à meia-noite local, no dia certo. */
export function dataLocal(iso: string): Date {
  const [y, m, d] = parteData(iso).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Valor para um <input type="date">. */
export function paraInputData(iso: string | null): string {
  return iso ? parteData(iso) : "";
}

// Padrão de data de todo o sistema: DD/MM/AAAA.

/** Converte uma data ISO para o formato de exibição (DD/MM/AAAA). */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = parteData(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Um Date (horário local) no formato DD/MM/AAAA. */
export function formatData(data: Date): string {
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${data.getFullYear()}`;
}

/** "AAAA-MM-DD" → "DD/MM/AAAA", para exibir num campo de data. */
export function isoParaCampo(iso: string): string {
  return iso ? formatDate(iso) : "";
}

/**
 * "DD/MM/AAAA" digitado → "AAAA-MM-DD".
 * Devolve null se a data estiver incompleta ou não existir (ex.: 31/02/2026).
 */
export function campoParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const ano = Number(aaaa);
  const data = new Date(ano, Number(mm) - 1, Number(dd));
  if (data.getFullYear() !== ano || data.getMonth() !== Number(mm) - 1 || data.getDate() !== Number(dd)) return null;
  return `${ano}-${mm}-${dd}`;
}

/** Aplica a máscara DD/MM/AAAA ao que foi digitado (só dígitos, barras automáticas). */
export function mascaraData(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter(Boolean).join("/");
}

export function getYear(iso: string): number {
  return parseInt(iso.slice(0, 4), 10);
}

/** Número de meses entre duas datas ISO, inclusive (usado para exibir a duração de um projeto). */
export function monthsBetween(startIso: string, endIso: string): number {
  const [ys, ms] = startIso.split("-").map(Number);
  const [ye, me] = endIso.split("-").map(Number);
  return (ye - ys) * 12 + (me - ms) + 1;
}

export function formatDuracao(startIso: string, endIso: string): string {
  return `${monthsBetween(startIso, endIso)} meses`;
}
