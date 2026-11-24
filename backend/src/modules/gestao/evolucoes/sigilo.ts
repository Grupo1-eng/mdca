// Evolução sigilosa (MDCA, perguntas 24 e 25): o conteúdo fica restrito aos
// técnicos do serviço de quem registrou. Quem registrou sempre vê, e os perfis
// de PERFIS_VEEM_TODO_SIGILOSO (a coordenação) veem todas.
//
// Quem não pode ver recebe a evolução sem o texto (data, tipo, situação e
// profissional continuam), com `conteudoOculto: true`. Encaminhamentos ligados
// a ela perdem a descrição e as observações dos acompanhamentos.
//
// O serviço sai do perfil ATUAL de quem registrou (sem coluna própria no
// banco): se o profissional mudar de perfil, as sigilosas dele mudam junto.
import { PERFIS, Perfil } from '../../auth/perfis.constants';
import { PERFIS_VEEM_TODO_SIGILOSO } from '../perfis-gestao';

const SERVICO_DO_PERFIL: Partial<Record<string, string>> = {
  [PERFIS.TECNICO_SERVICO_SOCIAL]: 'servico_social',
  [PERFIS.TECNICO_PSICOLOGIA]: 'psicologia',
};

export interface Leitor {
  id: number;
  perfil: string;
}

export interface EvolucaoComAutor {
  sigiloso?: boolean | null;
  profissionalId: number;
  profissional?: { perfil?: string | null } | null;
}

export function podeVerConteudo(
  evolucao: EvolucaoComAutor,
  leitor: Leitor,
): boolean {
  if (!evolucao.sigiloso) return true;
  if (evolucao.profissionalId === leitor.id) return true;
  if (PERFIS_VEEM_TODO_SIGILOSO.includes(leitor.perfil as Perfil)) return true;

  const servicoLeitor = SERVICO_DO_PERFIL[leitor.perfil];
  const servicoAutor = SERVICO_DO_PERFIL[evolucao.profissional?.perfil ?? ''];
  return servicoLeitor !== undefined && servicoLeitor === servicoAutor;
}

interface EncaminhamentoComTexto {
  descricao?: string | null;
  acompanhamentos?: { observacao?: string | null }[];
}

function ocultarEncaminhamento<T extends EncaminhamentoComTexto>(
  encaminhamento: T,
): T & { conteudoOculto: boolean } {
  return {
    ...encaminhamento,
    descricao: null,
    ...(encaminhamento.acompanhamentos && {
      acompanhamentos: encaminhamento.acompanhamentos.map((a) => ({
        ...a,
        observacao: null,
      })),
    }),
    conteudoOculto: true,
  };
}

// Aplica o sigilo a uma evolução lida do banco (com `profissional.perfil`).
export function aplicarSigiloEvolucao<
  T extends EvolucaoComAutor & {
    encaminhamentos?: EncaminhamentoComTexto[];
  },
>(evolucao: T, leitor: Leitor): T & { conteudoOculto: boolean } {
  if (podeVerConteudo(evolucao, leitor)) {
    return { ...evolucao, conteudoOculto: false };
  }
  return {
    ...evolucao,
    titulo: null,
    descricao: null,
    intervencaoUsuario: null,
    intervencaoFamilia: null,
    ...(evolucao.encaminhamentos && {
      encaminhamentos: evolucao.encaminhamentos.map(ocultarEncaminhamento),
    }),
    conteudoOculto: true,
  };
}

// Aplica o sigilo a um encaminhamento lido com `evolucao` (sigiloso, autor).
// O campo `evolucao` usado na conferência não vai na resposta.
export function aplicarSigiloEncaminhamento<
  T extends EncaminhamentoComTexto & { evolucao?: EvolucaoComAutor | null },
>(
  encaminhamento: T,
  leitor: Leitor,
): Omit<T, 'evolucao'> & { conteudoOculto: boolean } {
  const { evolucao, ...resto } = encaminhamento;
  if (!evolucao || podeVerConteudo(evolucao, leitor)) {
    return { ...resto, conteudoOculto: false };
  }
  return ocultarEncaminhamento(resto);
}

// Para incluir nas consultas de encaminhamento.
export const EVOLUCAO_PARA_SIGILO = {
  evolucao: {
    select: {
      sigiloso: true,
      profissionalId: true,
      profissional: { select: { perfil: true } },
    },
  },
} as const;
