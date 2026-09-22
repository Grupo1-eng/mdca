export const fmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/** Converte uma data ISO (YYYY-MM-DD) para o formato de exibição pt-BR (DD/MM/YYYY). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
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
