export type ModuloDestino = "financeiro" | "gestao";

export const MODULO_PADRAO: ModuloDestino = "financeiro";

export function moduloDaNavegacao(state: unknown): ModuloDestino {
  if (state && typeof state === "object" && "modulo" in state) {
    const modulo = (state as { modulo?: unknown }).modulo;
    if (modulo === "financeiro" || modulo === "gestao") return modulo;
  }
  return MODULO_PADRAO;
}

export function rotaDoModulo(modulo: ModuloDestino): `/${ModuloDestino}` {
  return `/${modulo}`;
}

export function rotaPosLogin(state: unknown): `/${ModuloDestino}` {
  return rotaDoModulo(moduloDaNavegacao(state));
}
