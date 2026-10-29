import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { compromissosSeed } from "./data/mock"
import {
  criarCompromissoEmMemoria,
  editarCompromissoEmMemoria,
  mudarStatusCompromissoEmMemoria,
} from "./model"
import type {
  Compromisso,
  DadosEditaveisCompromisso,
  StatusCompromisso,
} from "./types"

interface AgendaContextValue {
  compromissos: Compromisso[]
  criarCompromisso: (compromisso: Compromisso) => void
  editarCompromisso: (id: string, dados: DadosEditaveisCompromisso) => void
  mudarStatusCompromisso: (id: string, status: StatusCompromisso) => void
}

const AgendaContext = createContext<AgendaContextValue | null>(null)

export function GestaoAgendaProvider({ children }: { children: ReactNode }) {
  const [compromissos, setCompromissos] = useState(compromissosSeed)
  const compromissosAtuais = useRef(compromissosSeed)

  const aplicar = useCallback((proximos: Compromisso[]) => {
    compromissosAtuais.current = proximos
    setCompromissos(proximos)
  }, [])

  const criarCompromisso = useCallback(
    (compromisso: Compromisso) => {
      aplicar(
        criarCompromissoEmMemoria(compromissosAtuais.current, compromisso),
      )
    },
    [aplicar],
  )

  const editarCompromisso = useCallback(
    (id: string, dados: DadosEditaveisCompromisso) => {
      aplicar(editarCompromissoEmMemoria(compromissosAtuais.current, id, dados))
    },
    [aplicar],
  )

  const mudarStatusCompromisso = useCallback(
    (id: string, status: StatusCompromisso) => {
      aplicar(
        mudarStatusCompromissoEmMemoria(compromissosAtuais.current, id, status),
      )
    },
    [aplicar],
  )

  const value = useMemo<AgendaContextValue>(
    () => ({
      compromissos,
      criarCompromisso,
      editarCompromisso,
      mudarStatusCompromisso,
    }),
    [compromissos, criarCompromisso, editarCompromisso, mudarStatusCompromisso],
  )

  return (
    <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>
  )
}

export function useAgendaGestao(): AgendaContextValue {
  const context = useContext(AgendaContext)
  if (!context) {
    throw new Error(
      "useAgendaGestao deve ser usado dentro de GestaoAgendaProvider",
    )
  }
  return context
}
