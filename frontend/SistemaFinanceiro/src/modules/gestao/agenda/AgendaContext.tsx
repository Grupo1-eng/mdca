import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import * as api from "../api/compromissos"
import {
  deCompromissoApi,
  paraCompromissoPayload,
  situacaoParaApi,
} from "../api/compromissosMapper"
import { ehIdPersistido } from "../api/educandosMapper"
import { editarCompromissoEmMemoria } from "./model"
import type {
  Compromisso,
  DadosEditaveisCompromisso,
  StatusCompromisso,
} from "./types"

export type CargaAgenda = "ociosa" | "carregando" | "pronta" | "erro"

interface AgendaContextValue {
  // Compromissos da organização, lidos de GET /api/compromissos.
  compromissos: Compromisso[]
  carga: CargaAgenda
  erro: string | null
  // Idempotente: só busca na primeira chamada (ou depois de um erro).
  carregarCompromissos: () => void
  // O responsável é o usuário autenticado (definido pelo backend).
  criarCompromisso: (dados: DadosEditaveisCompromisso) => Promise<void>
  editarCompromisso: (
    id: string,
    dados: DadosEditaveisCompromisso,
  ) => Promise<void>
  mudarStatusCompromisso: (
    id: string,
    status: StatusCompromisso,
  ) => Promise<void>
}

const AgendaContext = createContext<AgendaContextValue | null>(null)

function ordenar(lista: Compromisso[]): Compromisso[] {
  return [...lista].sort((a, b) =>
    `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`),
  )
}

export function GestaoAgendaProvider({ children }: { children: ReactNode }) {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const compromissosAtuais = useRef<Compromisso[]>([])
  const [carga, setCarga] = useState<CargaAgenda>("ociosa")
  const cargaAtual = useRef<CargaAgenda>("ociosa")
  const [erro, setErro] = useState<string | null>(null)

  const aplicar = useCallback((proximos: Compromisso[]) => {
    const ordenados = ordenar(proximos)
    compromissosAtuais.current = ordenados
    setCompromissos(ordenados)
  }, [])

  // Substitui (ou acrescenta) o compromisso devolvido pelo servidor.
  const mesclar = useCallback(
    (registro: Compromisso) => {
      const atuais = compromissosAtuais.current
      aplicar(
        atuais.some((item) => item.id === registro.id)
          ? atuais.map((item) => (item.id === registro.id ? registro : item))
          : [...atuais, registro],
      )
    },
    [aplicar],
  )

  const carregarCompromissos = useCallback(() => {
    if (cargaAtual.current === "carregando" || cargaAtual.current === "pronta")
      return
    cargaAtual.current = "carregando"
    setCarga("carregando")
    setErro(null)
    api
      .listarCompromissos()
      .then((lista) => {
        aplicar(lista.map(deCompromissoApi))
        cargaAtual.current = "pronta"
        setCarga("pronta")
      })
      .catch((e: unknown) => {
        cargaAtual.current = "erro"
        setCarga("erro")
        setErro(
          e instanceof Error ? e.message : "Não foi possível carregar a agenda.",
        )
      })
  }, [aplicar])

  const criarCompromisso = useCallback(
    async (dados: DadosEditaveisCompromisso) => {
      mesclar(deCompromissoApi(await api.criarCompromisso(paraCompromissoPayload(dados))))
    },
    [mesclar],
  )

  const editarCompromisso = useCallback(
    async (id: string, dados: DadosEditaveisCompromisso) => {
      // Valida (existe, título e data) antes de enviar.
      editarCompromissoEmMemoria(compromissosAtuais.current, id, dados)
      if (!ehIdPersistido(id)) throw new Error("Compromisso não encontrado.")
      mesclar(
        deCompromissoApi(
          await api.atualizarCompromisso(Number(id), paraCompromissoPayload(dados)),
        ),
      )
    },
    [mesclar],
  )

  const mudarStatusCompromisso = useCallback(
    async (id: string, status: StatusCompromisso) => {
      if (!ehIdPersistido(id)) throw new Error("Compromisso não encontrado.")
      const resposta =
        status === "Cancelado"
          ? await api.cancelarCompromisso(Number(id))
          : await api.atualizarCompromisso(Number(id), {
              situacao: situacaoParaApi(status),
            })
      mesclar(deCompromissoApi(resposta))
    },
    [mesclar],
  )

  const value = useMemo<AgendaContextValue>(
    () => ({
      compromissos,
      carga,
      erro,
      carregarCompromissos,
      criarCompromisso,
      editarCompromisso,
      mudarStatusCompromisso,
    }),
    [
      compromissos,
      carga,
      erro,
      carregarCompromissos,
      criarCompromisso,
      editarCompromisso,
      mudarStatusCompromisso,
    ],
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
