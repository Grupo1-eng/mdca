export type ModuloDestino = "financeiro" | "gestao";

export const MODULO_PADRAO: ModuloDestino = "financeiro";

// Perfis que o backend libera em cada módulo. Espelha
// backend/src/modules/auth/perfis.constants.ts (PERFIS_FINANCEIRO e os perfis
// da Gestão). Texto, porque o tipo Perfil do frontend ainda não tem os perfis
// financeiros.
const PERFIS_POR_MODULO: Record<ModuloDestino, readonly string[]> = {
  financeiro: [
    "coordenador_financeiro",
    "gestor_financeiro",
    "analista_financeiro",
    "administrativo",
  ],
  gestao: [
    "coordenador",
    "tecnico_servico_social",
    "tecnico_psicologia",
    "educador",
    "administrativo",
  ],
};

export function podeAcessarModulo(
  modulo: ModuloDestino,
  perfil: string | undefined,
): boolean {
  return perfil !== undefined && PERFIS_POR_MODULO[modulo].includes(perfil);
}

// Módulo que o usuário realmente pode abrir: o pedido, se o perfil permitir;
// senão o outro, se o perfil permitir; senão o pedido (o backend responde 403).
export function moduloPermitido(
  pedido: ModuloDestino,
  perfil: string | undefined,
): ModuloDestino {
  if (podeAcessarModulo(pedido, perfil)) return pedido;
  const outro: ModuloDestino = pedido === "financeiro" ? "gestao" : "financeiro";
  return podeAcessarModulo(outro, perfil) ? outro : pedido;
}

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

// Sem perfil (ex.: testes antigos), respeita só a escolha feita no login.
export function rotaPosLogin(
  state: unknown,
  perfil?: string,
): `/${ModuloDestino}` {
  const pedido = moduloDaNavegacao(state);
  return rotaDoModulo(perfil === undefined ? pedido : moduloPermitido(pedido, perfil));
}
