export const PERFIS = {
  COORDENACAO: 'coordenador',
  TECNICO_SERVICO_SOCIAL: 'tecnico_servico_social',
  TECNICO_PSICOLOGIA: 'tecnico_psicologia',
  EDUCADOR: 'educador',
  ADMINISTRATIVO: 'administrativo',
  COORDENADOR_FINANCEIRO: 'coordenador_financeiro',
  GESTOR_FINANCEIRO: 'gestor_financeiro',
  ANALISTA_FINANCEIRO: 'analista_financeiro',
} as const;

export type Perfil = (typeof PERFIS)[keyof typeof PERFIS];

export const PERFIS_TECNICOS: Perfil[] = [
  PERFIS.COORDENACAO,
  PERFIS.TECNICO_SERVICO_SOCIAL,
  PERFIS.TECNICO_PSICOLOGIA,
];

// Únicos perfis com acesso ao módulo financeiro (dados sensíveis da organização).
export const PERFIS_FINANCEIRO: Perfil[] = [
  PERFIS.COORDENADOR_FINANCEIRO,
  PERFIS.GESTOR_FINANCEIRO,
  PERFIS.ANALISTA_FINANCEIRO,
];

export const PERFIS_TODOS: Perfil[] = [
  PERFIS.COORDENACAO,
  PERFIS.TECNICO_SERVICO_SOCIAL,
  PERFIS.TECNICO_PSICOLOGIA,
  PERFIS.EDUCADOR,
  PERFIS.ADMINISTRATIVO,
  PERFIS.COORDENADOR_FINANCEIRO,
  PERFIS.GESTOR_FINANCEIRO,
  PERFIS.ANALISTA_FINANCEIRO,
];