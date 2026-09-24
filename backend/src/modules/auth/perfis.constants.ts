export const PERFIS = {
  COORDENACAO: 'coordenador',
  TECNICO_SERVICO_SOCIAL: 'tecnico_servico_social',
  TECNICO_PSICOLOGIA: 'tecnico_psicologia',
  EDUCADOR: 'educador',
  ADMINISTRATIVO: 'administrativo',
} as const;

export type Perfil = (typeof PERFIS)[keyof typeof PERFIS];

export const PERFIS_TECNICOS: Perfil[] = [
  PERFIS.COORDENACAO,
  PERFIS.TECNICO_SERVICO_SOCIAL,
  PERFIS.TECNICO_PSICOLOGIA,
];

export const PERFIS_TODOS: Perfil[] = [
  PERFIS.COORDENACAO,
  PERFIS.TECNICO_SERVICO_SOCIAL,
  PERFIS.TECNICO_PSICOLOGIA,
  PERFIS.EDUCADOR,
  PERFIS.ADMINISTRATIVO,
];