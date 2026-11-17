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
import * as api from "../api/educandos"
import { deEducandoApi, ehIdPersistido } from "../api/educandosMapper"
import { listarIniciativas } from "../api/iniciativas"
import { salvarEducandoRemoto } from "../api/educandosFluxo"
import { permissoesEducandos } from "./model"
import type { Educando, Iniciativa } from "./types"

export type SaveState = "idle" | "saving" | "saved" | "error"

// Situação da carga dos educandos a partir da API.
export type CargaEducandos = "ociosa" | "carregando" | "pronta" | "erro"

interface EducandosContextValue {
  // Iniciativas reais (GET /api/iniciativas), carregadas junto com os
  // educandos.
  iniciativas: Iniciativa[]
  // Educandos vêm da API real (GET /api/educandos); atendimentos e
  // encaminhamentos, de useEvolucoesEducando. Atividades, encontros e
  // frequência têm telas próprias (api/atividades.ts).
  educandos: Educando[]
  cargaEducandos: CargaEducandos
  erroEducandos: string | null
  // Idempotente: só busca na primeira chamada (ou depois de um erro).
  carregarEducandos: () => void
  // Idempotente: carrega as iniciativas sem os educandos (tela de atividades).
  carregarIniciativas: () => void
  // Busca de novo as iniciativas (depois de cadastrar ou editar uma).
  atualizarIniciativas: () => void
  // Busca a ficha completa (com responsáveis) e atualiza a lista.
  carregarEducando: (id: string) => Promise<void>
  iniciativaNome: (id: string) => string
  // Devolve o registro salvo, com o id definitivo do servidor.
  salvarEducando: (educando: Educando) => Promise<Educando>
  alternarSituacaoEducando: (id: string) => Promise<void>
}

const EducandosContext = createContext<EducandosContextValue | null>(null)

export function GestaoEducandosProvider({ children }: { children: ReactNode }) {
  const [educandos, setEducandos] = useState<Educando[]>([])
  const educandosAtuais = useRef<Educando[]>([])
  const [cargaEducandos, setCargaEducandos] =
    useState<CargaEducandos>("ociosa")
  const cargaAtual = useRef<CargaEducandos>("ociosa")
  const [erroEducandos, setErroEducandos] = useState<string | null>(null)

  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([])
  const iniciativasCarregadas = useRef(false)

  // Idempotente; em caso de erro, tenta de novo na próxima carga.
  const carregarIniciativas = useCallback(() => {
    if (iniciativasCarregadas.current) return
    iniciativasCarregadas.current = true
    listarIniciativas()
      .then(setIniciativas)
      .catch(() => {
        iniciativasCarregadas.current = false
      })
  }, [])

  const atualizarIniciativas = useCallback(() => {
    iniciativasCarregadas.current = false
    carregarIniciativas()
  }, [carregarIniciativas])

  const iniciativaNome = useCallback(
    (id: string) =>
      iniciativas.find((iniciativa) => iniciativa.id === id)?.nome ?? "—",
    [iniciativas],
  )

  const aplicarEducandos = useCallback((proximos: Educando[]) => {
    educandosAtuais.current = proximos
    setEducandos(proximos)
  }, [])

  // Substitui (ou acrescenta) um educando, preservando os responsáveis já
  // carregados quando a resposta não os traz (a listagem não traz).
  const mesclarEducando = useCallback(
    (registro: Educando) => {
      const atuais = educandosAtuais.current
      const anterior = atuais.find((item) => item.id === registro.id)
      const completo =
        anterior && registro.responsaveis.length === 0
          ? { ...registro, responsaveis: anterior.responsaveis }
          : registro
      aplicarEducandos(
        anterior
          ? atuais.map((item) => (item.id === completo.id ? completo : item))
          : [...atuais, completo].sort((a, b) => a.nome.localeCompare(b.nome)),
      )
      return completo
    },
    [aplicarEducandos],
  )

  const carregarEducandos = useCallback(() => {
    carregarIniciativas()
    if (cargaAtual.current === "carregando" || cargaAtual.current === "pronta")
      return
    cargaAtual.current = "carregando"
    setCargaEducandos("carregando")
    setErroEducandos(null)
    api
      .listarEducandos()
      .then((lista) => {
        aplicarEducandos(lista.map(deEducandoApi))
        cargaAtual.current = "pronta"
        setCargaEducandos("pronta")
      })
      .catch((erro: unknown) => {
        cargaAtual.current = "erro"
        setCargaEducandos("erro")
        setErroEducandos(
          erro instanceof Error
            ? erro.message
            : "Não foi possível carregar os educandos.",
        )
      })
  }, [aplicarEducandos, carregarIniciativas])

  const carregarEducando = useCallback(
    async (id: string) => {
      carregarIniciativas()
      if (!ehIdPersistido(id)) return
      mesclarEducando(deEducandoApi(await api.buscarEducando(Number(id))))
    },
    [mesclarEducando, carregarIniciativas],
  )

  const salvarEducando = useCallback(
    async (registro: Educando) =>
      mesclarEducando(
        await salvarEducandoRemoto(registro, educandosAtuais.current),
      ),
    [mesclarEducando],
  )

  const alternarSituacaoEducando = useCallback(
    async (id: string) => {
      const atual = educandosAtuais.current.find((item) => item.id === id)
      if (!atual || !ehIdPersistido(id)) {
        throw new Error("Educando não encontrado.")
      }
      const resposta =
        atual.situacaoVinculo === "Ativo"
          ? await api.inativarEducando(Number(id))
          : await api.reativarEducando(Number(id))
      mesclarEducando(deEducandoApi(resposta))
    },
    [mesclarEducando],
  )

  const value = useMemo<EducandosContextValue>(
    () => ({
      iniciativas,
      educandos,
      cargaEducandos,
      erroEducandos,
      carregarEducandos,
      carregarIniciativas,
      atualizarIniciativas,
      carregarEducando,
      iniciativaNome,
      salvarEducando,
      alternarSituacaoEducando,
    }),
    [
      iniciativas,
      educandos,
      cargaEducandos,
      erroEducandos,
      carregarEducandos,
      carregarIniciativas,
      atualizarIniciativas,
      carregarEducando,
      iniciativaNome,
      salvarEducando,
      alternarSituacaoEducando,
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

  // `acao` pode ser síncrona (mock) ou assíncrona (API real).
  const salvar = useCallback(
    async (acao: () => unknown, forcarErro = false) => {
    setEstado("saving")
    setMensagem(null)

    if (forcarErro) {
      setEstado("error")
      setMensagem("Falha de envio. Os dados preenchidos foram mantidos.")
      return false
    }

    try {
      await acao()
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
    },
    [],
  )

  return { estado, mensagem, salvar }
}
