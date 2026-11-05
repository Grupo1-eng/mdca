import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  atendimentosSeed,
  atividadesSeed,
  compromissosSeed,
  educandosSeed,
  encaminhamentosSeed,
  encontrosSeed,
  iniciativasSeed,
  logsSeed,
  PERFIS,
  usuariosSeed,
  type Atendimento,
  type Atividade,
  type Compromisso,
  type Educando,
  type Encaminhamento,
  type Encontro,
  type Iniciativa,
  type LogAuditoria,
  type PerfilId,
  type AcompanhamentoEncaminhamento,
  type Usuario,
} from "./mock-data";
import {
  autenticar,
  getIndicadores,
  patchCancelarCompromisso,
  patchCompromisso,
  patchEducando,
  postAcompanhamento,
  patchInativarEducando,
  patchIniciativa,
  patchSituacaoCompromisso,
  patchSituacaoEncontro,
  patchUsuario,
  postAtividade,
  postCompromisso,
  postEducando,
  postEncaminhamento,
  postEncontro,
  postEvolucao,
  postFrequencia,
  postIniciativa,
  postUsuario,
  SESSAO_CHAVE,
  type FiltroIndicadores,
} from "./gestao-api";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface StoreValue {
  sessaoPronta: boolean;
  usuario: Usuario | null;
  perfil: PerfilId | null;
  entrar: (email: string, senha: string) => void;
  sair: () => void;
  iniciativas: Iniciativa[];
  educandos: Educando[];
  atendimentos: Atendimento[];
  encaminhamentos: Encaminhamento[];
  atividades: Atividade[];
  encontros: Encontro[];
  compromissos: Compromisso[];
  usuarios: Usuario[];
  logs: LogAuditoria[];
  iniciativaNome: (id: string) => string;
  nomePerfil: (perfil: PerfilId) => string;
  salvarEducando: (dados: Educando) => void;
  alternarSituacaoEducando: (id: string) => void;
  registrarEvolucao: (dados: Atendimento) => void;
  registrarEncaminhamento: (dados: Encaminhamento) => void;
  registrarAcompanhamento: (id: string, acompanhamento: AcompanhamentoEncaminhamento) => void;
  criarCompromisso: (dados: Compromisso) => void;
  editarCompromisso: (
    id: string,
    parcial: Pick<Compromisso, "titulo" | "data" | "horario" | "observacoes" | "local" | "tipo">,
  ) => void;
  mudarSituacaoCompromisso: (id: string, status: Compromisso["status"]) => void;
  criarAtividade: (dados: Atividade) => void;
  criarEncontro: (dados: Encontro) => void;
  registrarFrequencia: (
    encontroId: string,
    participantes: { educandoId: string; presente: boolean; observacao?: string }[],
  ) => void;
  mudarSituacaoEncontro: (id: string, situacao: Encontro["situacao"]) => void;
  salvarIniciativa: (dados: Iniciativa, editando: boolean) => void;
  criarUsuario: (dados: Usuario) => void;
  alterarPerfilUsuario: (id: string, perfil: PerfilId) => void;
  alternarSituacaoUsuario: (id: string) => void;
  indicadores: (filtro: FiltroIndicadores) => ReturnType<typeof getIndicadores>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sessaoPronta, setSessaoPronta] = useState(false);
  const [iniciativas, setIniciativas] = useState(iniciativasSeed);
  const [educandos, setEducandos] = useState(educandosSeed);
  const [atendimentos, setAtendimentos] = useState(atendimentosSeed);
  const [encaminhamentos, setEncaminhamentos] = useState(encaminhamentosSeed);
  const [atividades, setAtividades] = useState(atividadesSeed);
  const [encontros, setEncontros] = useState(encontrosSeed);
  const [compromissos, setCompromissos] = useState(compromissosSeed);
  const [usuarios, setUsuarios] = useState(usuariosSeed);
  const [logs] = useState(logsSeed);

  useEffect(() => {
    const id = sessionStorage.getItem(SESSAO_CHAVE);
    if (id) {
      const salvo = usuariosSeed.find((u) => u.id === id && u.situacao === "Ativo");
      if (salvo) setUsuario(salvo);
      else sessionStorage.removeItem(SESSAO_CHAVE);
    }
    setSessaoPronta(true);
  }, []);

  const entrar = useCallback(
    (email: string, senha: string) => {
      const autenticado = autenticar(usuarios, email, senha);
      setUsuario(autenticado);
      sessionStorage.setItem(SESSAO_CHAVE, autenticado.id);
    },
    [usuarios],
  );

  const sair = useCallback(() => {
    sessionStorage.removeItem(SESSAO_CHAVE);
    setUsuario(null);
  }, []);

  const iniciativaNome = useCallback(
    (id: string) => iniciativas.find((i) => i.id === id)?.nome ?? "—",
    [iniciativas],
  );

  const nomePerfil = useCallback(
    (perfil: PerfilId) => PERFIS.find((p) => p.id === perfil)?.nome ?? perfil,
    [],
  );

  const sincronizarSessao = useCallback((lista: Usuario[]) => {
    setUsuario((atual) => {
      if (!atual) return atual;
      const proximo = lista.find((u) => u.id === atual.id);
      if (!proximo || proximo.situacao !== "Ativo") {
        sessionStorage.removeItem(SESSAO_CHAVE);
        return null;
      }
      return proximo;
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      sessaoPronta,
      usuario,
      perfil: usuario?.perfil ?? null,
      entrar,
      sair,
      iniciativas,
      educandos,
      atendimentos,
      encaminhamentos,
      atividades,
      encontros,
      compromissos,
      usuarios,
      logs,
      iniciativaNome,
      nomePerfil,
      salvarEducando: (dados) => {
        setEducandos(
          educandos.some((e) => e.id === dados.id)
            ? patchEducando(educandos, dados)
            : postEducando(educandos, dados),
        );
      },
      alternarSituacaoEducando: (id) => setEducandos(patchInativarEducando(educandos, id)),
      registrarEvolucao: (dados) => setAtendimentos(postEvolucao(atendimentos, dados)),
      registrarEncaminhamento: (dados) => setEncaminhamentos(postEncaminhamento(encaminhamentos, dados)),
      registrarAcompanhamento: (id, acompanhamento) =>
        setEncaminhamentos(postAcompanhamento(encaminhamentos, id, acompanhamento)),
      criarCompromisso: (dados) => setCompromissos(postCompromisso(compromissos, dados)),
      editarCompromisso: (id, parcial) => setCompromissos(patchCompromisso(compromissos, id, parcial)),
      mudarSituacaoCompromisso: (id, status) =>
        setCompromissos(
          status === "Cancelado"
            ? patchCancelarCompromisso(compromissos, id)
            : patchSituacaoCompromisso(compromissos, id, status),
        ),
      criarAtividade: (dados) => setAtividades(postAtividade(atividades, dados)),
      criarEncontro: (dados) => setEncontros(postEncontro(encontros, dados)),
      registrarFrequencia: (encontroId, participantes) =>
        setEncontros(postFrequencia(encontros, encontroId, participantes)),
      mudarSituacaoEncontro: (id, situacao) => setEncontros(patchSituacaoEncontro(encontros, id, situacao)),
      salvarIniciativa: (dados, editando) =>
        setIniciativas(editando ? patchIniciativa(iniciativas, dados) : postIniciativa(iniciativas, dados)),
      criarUsuario: (dados) => setUsuarios(postUsuario(usuarios, dados)),
      alterarPerfilUsuario: (id, perfil) => {
        const proxima = patchUsuario(usuarios, id, { perfil });
        sincronizarSessao(proxima);
        setUsuarios(proxima);
      },
      alternarSituacaoUsuario: (id) => {
        const atual = usuarios.find((u) => u.id === id);
        const proxima = patchUsuario(usuarios, id, {
          situacao: atual?.situacao === "Ativo" ? "Inativo" : "Ativo",
        });
        sincronizarSessao(proxima);
        setUsuarios(proxima);
      },
      indicadores: (filtro) =>
        getIndicadores({ educandos, atendimentos, encontros, atividades, iniciativas }, filtro),
    }),
    [
      sessaoPronta,
      usuario,
      entrar,
      sair,
      iniciativas,
      educandos,
      atendimentos,
      encaminhamentos,
      atividades,
      encontros,
      compromissos,
      usuarios,
      logs,
      iniciativaNome,
      nomePerfil,
      sincronizarSessao,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}

export function useSalvar() {
  const [estado, setEstado] = useState<SaveState>("idle");
  const [mensagem, setMensagem] = useState<string | null>(null);

  const salvar = useCallback(async (acao: () => void | Promise<void>, forcarErro = false) => {
    setEstado("saving");
    setMensagem(null);
    await new Promise((r) => setTimeout(r, 700));
    if (forcarErro) {
      setEstado("error");
      setMensagem("Falha de envio. Os dados preenchidos foram mantidos.");
      return false;
    }
    try {
      await acao();
      setEstado("saved");
      setTimeout(() => setEstado("idle"), 2500);
      return true;
    } catch (erro) {
      setEstado("error");
      setMensagem(
        erro instanceof Error ? erro.message : "Erro ao salvar. Os dados preenchidos foram mantidos.",
      );
      return false;
    }
  }, []);

  return { estado, salvar, mensagem, setEstado };
}

export interface Permissoes {
  verFichaCompleta: boolean;
  verCadastro: boolean;
  editarCadastro: boolean;
  verEvolucao: boolean;
  verSaude: boolean;
  verConfiguracoes: boolean;
  verIndicadores: boolean;
  inativarEducando: boolean;
  cadastrarIniciativa: boolean;
  registrarAtividade: boolean;
}

const semAcesso: Permissoes = {
  verFichaCompleta: false,
  verCadastro: false,
  editarCadastro: false,
  verEvolucao: false,
  verSaude: false,
  verConfiguracoes: false,
  verIndicadores: false,
  inativarEducando: false,
  cadastrarIniciativa: false,
  registrarAtividade: false,
};

export function permissoesDe(perfil: PerfilId | null): Permissoes {
  switch (perfil) {
    case "coordenacao":
      return {
        verFichaCompleta: true,
        verCadastro: true,
        editarCadastro: true,
        verEvolucao: true,
        verSaude: true,
        verConfiguracoes: true,
        verIndicadores: true,
        inativarEducando: true,
        cadastrarIniciativa: true,
        registrarAtividade: true,
      };
    case "servico_social":
    case "psicologia":
      return {
        ...semAcesso,
        verFichaCompleta: true,
        verCadastro: true,
        editarCadastro: true,
        verEvolucao: true,
        verSaude: true,
      };
    case "administrativo":
      return {
        ...semAcesso,
        verCadastro: true,
        verIndicadores: true,
      };
    case "educador":
      return { ...semAcesso, registrarAtividade: true };
    default:
      return semAcesso;
  }
}

export function usePermissoes() {
  const { perfil } = useStore();
  return permissoesDe(perfil);
}

export const novoId = (prefixo: string) => `${prefixo}-${Math.random().toString(36).slice(2, 8)}`;
