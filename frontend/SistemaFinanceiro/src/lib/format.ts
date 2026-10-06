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

/** Converte uma data ISO para o formato de exibição pt-BR (DD/MM/YYYY). */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = parteData(iso).split("-");
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
