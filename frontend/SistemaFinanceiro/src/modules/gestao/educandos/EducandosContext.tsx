import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/context/AuthContext"
import {
  atendimentosSeed,
  atividadesSeed,
  educandosSeed,
  encaminhamentosSeed,
  encontrosSeed,
  iniciativasSeed,
} from "./data/mock"
import {
  alternarSituacaoEmMemoria,
  permissoesEducandos,
  salvarEducandoEmMemoria,
} from "./model"
import type {
  AcompanhamentoEncaminhamento,
  Atendimento,
  Atividade,
  Educando,
  Encaminhamento,
  Encontro,
  Iniciativa,
} from "./types"

export type SaveState = "idle" | "saving" | "saved" | "error"

interface EducandosContextValue {
  iniciativas: Iniciativa[]
  educandos: Educando[]
  atendimentos: Atendimento[]
  encaminhamentos: Encaminhamento[]
  atividades: Atividade[]
  encontros: Encontro[]
  iniciativaNome: (id: string) => string
  salvarEducando: (educando: Educando) => void
  alternarSituacaoEducando: (id: string) => void
  registrarEvolucao: (atendimento: Atendimento) => void
  registrarEncaminhamento: (encaminhamento: Encaminhamento) => void
  registrarAcompanhamento: (
    encaminhamentoId: string,
    acompanhamento: AcompanhamentoEncaminhamento,
  ) => void
}

const EducandosContext = createContext<EducandosContextValue | null>(null)

export function GestaoEducandosProvider({ children }: { children: ReactNode }) {
  const [educandos, setEducandos] = useState(educandosSeed)
  const educandosAtuais = useRef(educandosSeed)
  const [atendimentos, setAtendimentos] = useState(atendimentosSeed)
  const [encaminhamentos, setEncaminhamentos] = useState(encaminhamentosSeed)

  const iniciativaNome = useCallback(
    (id: string) =>
      iniciativasSeed.find((iniciativa) => iniciativa.id === id)?.nome ?? "—",
    [],
  )

  const salvarEducando = useCallback((registro: Educando) => {
    // Valida contra o estado mais recente antes de agendar a atualização React.
    // Assim uma duplicidade lança erro de forma síncrona e o formulário não navega.
    const proximos = salvarEducandoEmMemoria(educandosAtuais.current, registro)
    educandosAtuais.current = proximos
    setEducandos(proximos)
  }, [])

  const alternarSituacaoEducando = useCallback((id: string) => {
    const proximos = alternarSituacaoEmMemoria(educandosAtuais.current, id)
    educandosAtuais.current = proximos
    setEducandos(proximos)
  }, [])

  const registrarEvolucao = useCallback((atendimento: Atendimento) => {
    setAtendimentos((atuais) => [atendimento, ...atuais])
  }, [])

  const registrarEncaminhamento = useCallback(
    (encaminhamento: Encaminhamento) => {
      setEncaminhamentos((atuais) => [encaminhamento, ...atuais])
    },
    [],
  )

  const registrarAcompanhamento = useCallback(
    (
      encaminhamentoId: string,
      acompanhamento: AcompanhamentoEncaminhamento,
    ) => {
      setEncaminhamentos((atuais) =>
        atuais.map((encaminhamento) =>
          encaminhamento.id === encaminhamentoId
            ? {
                ...encaminhamento,
                acompanhamentos: [
                  ...encaminhamento.acompanhamentos,
                  acompanhamento,
                ],
              }
            : encaminhamento,
        ),
      )
    },
    [],
  )

  const value = useMemo<EducandosContextValue>(
    () => ({
      iniciativas: iniciativasSeed,
      educandos,
      atendimentos,
      encaminhamentos,
      atividades: atividadesSeed,
      encontros: encontrosSeed,
      iniciativaNome,
      salvarEducando,
      alternarSituacaoEducando,
      registrarEvolucao,
      registrarEncaminhamento,
      registrarAcompanhamento,
    }),
    [
      educandos,
      atendimentos,
      encaminhamentos,
      iniciativaNome,
      salvarEducando,
      alternarSituacaoEducando,
      registrarEvolucao,
      registrarEncaminhamento,
      registrarAcompanhamento,
    ],
  )

  return (
    <EducandosContext.Provider value={value}>
      {children}
    </EducandosContext.Provider>
  )
}

export function useEducandosGestao(): EducandosContextValue {
  const context = useContext(EducandosContext)
  if (!context) {
    throw new Error(
      "useEducandosGestao deve ser usado dentro de GestaoEducandosProvider",
    )
  }
  return context
}

export function usePermissoesEducandos() {
  const { user } = useAuth()
  return permissoesEducandos(user?.perfil)
}

export function useSalvarGestao() {
  const [estado, setEstado] = useState<SaveState>("idle")
  const [mensagem, setMensagem] = useState<string | null>(null)

  const salvar = useCallback(async (acao: () => void, forcarErro = false) => {
    setEstado("saving")
    setMensagem(null)
    await new Promise((resolve) => setTimeout(resolve, 700))

    if (forcarErro) {
      setEstado("error")
      setMensagem("Falha de envio. Os dados preenchidos foram mantidos.")
      return false
    }

    try {
      acao()
      setEstado("saved")
      window.setTimeout(() => setEstado("idle"), 2500)
      return true
    } catch (error) {
      setEstado("error")
      setMensagem(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      )
      return false
    }
  }, [])

  return { estado, mensagem, salvar }
}
