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

// Perfis que só existem no financeiro (a coordenação e o administrativo
// atuam nos dois módulos).
export const PERFIS_EXCLUSIVOS_FINANCEIRO: Perfil[] = [
  PERFIS.COORDENADOR_FINANCEIRO,
  PERFIS.GESTOR_FINANCEIRO,
  PERFIS.ANALISTA_FINANCEIRO,
];

// Únicos perfis com acesso ao módulo financeiro (dados sensíveis da organização).
// A coordenação é admin dos dois módulos: é ela quem cria os usuários.
export const PERFIS_FINANCEIRO: Perfil[] = [
  PERFIS.COORDENACAO,
  ...PERFIS_EXCLUSIVOS_FINANCEIRO,
  PERFIS.ADMINISTRATIVO,
];

// Quem consulta, exporta e vê o histórico do log de auditoria do financeiro.
export const PERFIS_AUDITORIA_FINANCEIRO: Perfil[] = [
  PERFIS.COORDENACAO,
  PERFIS.COORDENADOR_FINANCEIRO,
  PERFIS.GESTOR_FINANCEIRO,
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