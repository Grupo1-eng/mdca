import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  atendimentosSeed,
  atividadesSeed,
  compromissosSeed,
  educandosSeed,
  encaminhamentosSeed,
  encontrosSeed,
  iniciativasSeed,
  logsSeed,
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
  type Usuario,
} from "./mock-data";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface StoreValue {
  perfil: PerfilId;
  setPerfil: (p: PerfilId) => void;
  iniciativas: Iniciativa[];
  educandos: Educando[];
  atendimentos: Atendimento[];
  encaminhamentos: Encaminhamento[];
  atividades: Atividade[];
  encontros: Encontro[];
  compromissos: Compromisso[];
  usuarios: Usuario[];
  logs: LogAuditoria[];
  setIniciativas: React.Dispatch<React.SetStateAction<Iniciativa[]>>;
  setEducandos: React.Dispatch<React.SetStateAction<Educando[]>>;
  setAtendimentos: React.Dispatch<React.SetStateAction<Atendimento[]>>;
  setEncaminhamentos: React.Dispatch<React.SetStateAction<Encaminhamento[]>>;
  setAtividades: React.Dispatch<React.SetStateAction<Atividade[]>>;
  setEncontros: React.Dispatch<React.SetStateAction<Encontro[]>>;
  setCompromissos: React.Dispatch<React.SetStateAction<Compromisso[]>>;
  setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
  iniciativaNome: (id: string) => string;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilId>("coordenacao");
  const [iniciativas, setIniciativas] = useState(iniciativasSeed);
  const [educandos, setEducandos] = useState(educandosSeed);
  const [atendimentos, setAtendimentos] = useState(atendimentosSeed);
  const [encaminhamentos, setEncaminhamentos] = useState(encaminhamentosSeed);
  const [atividades, setAtividades] = useState(atividadesSeed);
  const [encontros, setEncontros] = useState(encontrosSeed);
  const [compromissos, setCompromissos] = useState(compromissosSeed);
  const [usuarios, setUsuarios] = useState(usuariosSeed);
  const [logs] = useState(logsSeed);

  const iniciativaNome = useCallback(
    (id: string) => iniciativas.find((i) => i.id === id)?.nome ?? "—",
    [iniciativas],
  );

  const value = useMemo(
    () => ({
      perfil,
      setPerfil,
      iniciativas,
      educandos,
      atendimentos,
      encaminhamentos,
      atividades,
      encontros,
      compromissos,
      usuarios,
      logs,
      setIniciativas,
      setEducandos,
      setAtendimentos,
      setEncaminhamentos,
      setAtividades,
      setEncontros,
      setCompromissos,
      setUsuarios,
      iniciativaNome,
    }),
    [
      perfil,
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
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}

/** Simula o salvamento de um formulário com estados visíveis. */
export function useSalvar() {
  const [estado, setEstado] = useState<SaveState>("idle");

  const salvar = useCallback(async (acao: () => void, forcarErro = false) => {
    setEstado("saving");
    await new Promise((r) => setTimeout(r, 700));
    if (forcarErro) {
      setEstado("error");
      return false;
    }
    acao();
    setEstado("saved");
    setTimeout(() => setEstado("idle"), 2500);
    return true;
  }, []);

  return { estado, salvar, setEstado };
}

// ---------- Permissões (mock) ----------
export interface Permissoes {
  verFichas: boolean;
  verSigiloso: boolean;
  verConfiguracoes: boolean;
  verIndicadores: boolean;
}

export function permissoesDe(perfil: PerfilId): Permissoes {
  switch (perfil) {
    case "coordenacao":
      return { verFichas: true, verSigiloso: true, verConfiguracoes: true, verIndicadores: true };
    case "servico_social":
    case "psicologia":
      return { verFichas: true, verSigiloso: true, verConfiguracoes: false, verIndicadores: true };
    case "administrativo":
      return { verFichas: true, verSigiloso: false, verConfiguracoes: false, verIndicadores: true };
    case "educador":
    default:
      return { verFichas: false, verSigiloso: false, verConfiguracoes: false, verIndicadores: false };
  }
}

export function usePermissoes() {
  const { perfil } = useStore();
  return permissoesDe(perfil);
}

export const novoId = (prefixo: string) =>
  `${prefixo}-${Math.random().toString(36).slice(2, 8)}`;
