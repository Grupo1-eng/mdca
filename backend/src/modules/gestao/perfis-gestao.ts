// Quem pode o quê na Gestão. Para mudar uma permissão, altere só esta lista.
import { PERFIS, PERFIS_TECNICOS, Perfil } from '../auth/perfis.constants';

// Todos os perfis da Gestão: consultam educandos, iniciativas e atividades.
// Perfis exclusivos do Financeiro ficam de fora.
export const PERFIS_GESTAO: Perfil[] = [
  ...PERFIS_TECNICOS,
  PERFIS.EDUCADOR,
  PERFIS.ADMINISTRATIVO,
];

// Vinculam educandos às iniciativas (mesmo grupo que cadastra educandos).
export const PERFIS_VINCULO_INICIATIVA: Perfil[] = [...PERFIS_TECNICOS];

// Cadastram e editam projetos, serviços e programas (combinado com o
// Financeiro: só a Gestão cadastra iniciativas, e na Gestão só a coordenação).
export const PERFIS_CADASTRO_INICIATIVA: Perfil[] = [PERFIS.COORDENACAO];

// Registram atividades, encontros e chamada (documento da Sprint 1, seção 3.1).
export const PERFIS_REGISTRO_ATIVIDADES: Perfil[] = [
  PERFIS.COORDENACAO,
  PERFIS.EDUCADOR,
];

// Veem o conteúdo de toda evolução sigilosa, de qualquer serviço. Os técnicos
// veem só as sigilosas do próprio serviço (MDCA, perguntas 24 e 25), e quem
// registrou sempre vê. Regra em `evolucoes/sigilo.ts`.
export const PERFIS_VEEM_TODO_SIGILOSO: Perfil[] = [PERFIS.COORDENACAO];

// Recebem o cadastro inteiro na listagem de educandos (GET /api/educandos).
// Os demais perfis da Gestão (educador, administrativo) recebem só id, nome,
// situação e vínculos ativos: o suficiente para a chamada e a lista.
export const PERFIS_LISTAGEM_COMPLETA_EDUCANDOS: Perfil[] = [...PERFIS_TECNICOS];

// Recebem o orçamento total das iniciativas (GET /api/iniciativas). MDCA,
// perguntas 17 e 22: o financeiro fica restrito a quem trabalha no setor.
export const PERFIS_VEEM_ORCAMENTO_INICIATIVA: Perfil[] = [PERFIS.COORDENACAO];
