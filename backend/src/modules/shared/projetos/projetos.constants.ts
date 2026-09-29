export const TIPOS_PROJETO = [
  'PROJETO',
  'SERVICO',
  'PROGRAMA',
] as const;

export type TipoProjeto = (typeof TIPOS_PROJETO)[number];