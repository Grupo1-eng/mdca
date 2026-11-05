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

// Registram atividades, encontros e chamada (documento da Sprint 1, seção 3.1).
export const PERFIS_REGISTRO_ATIVIDADES: Perfil[] = [
  PERFIS.COORDENACAO,
  PERFIS.EDUCADOR,
];
