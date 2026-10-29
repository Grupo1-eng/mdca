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
import { salvarEducandoRemoto } from "../api/educandosFluxo"
import {
  atendimentosSeed,
  atividadesSeed,
  encaminhamentosSeed,
  encontrosSeed,
  iniciativasSeed,
} from "./data/mock"
import { salvarAtividadeEmMemoria } from "../atividades/model"
import { permissoesEducandos } from "./model"
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

// Situação da carga dos educandos a partir da API.
export type CargaEducandos = "ociosa" | "carregando" | "pronta" | "erro"

interface EducandosContextValue {
  iniciativas: Iniciativa[]
  // Educandos vêm da API real (GET /api/educandos). Os demais dados desta
  // tela ainda são mock, até as próximas fases da integração.
  educandos: Educando[]
  cargaEducandos: CargaEducandos
  erroEducandos: string | null
  // Idempotente: só busca na primeira chamada (ou depois de um erro).
  carregarEducandos: () => void
  // Busca a ficha completa (com responsáveis) e atualiza a lista.
  carregarEducando: (id: string) => Promise<void>
  atendimentos: Atendimento[]
  encaminhamentos: Encaminhamento[]
  atividades: Atividade[]
  encontros: Encontro[]
  iniciativaNome: (id: string) => string
  // Devolve o registro salvo, com o id definitivo do servidor.
  salvarEducando: (educando: Educando) => Promise<Educando>
  alternarSituacaoEducando: (id: string) => Promise<void>
  registrarEvolucao: (atendimento: Atendimento) => void
  registrarEncaminhamento: (encaminhamento: Encaminhamento) => void
  registrarAcompanhamento: (
    encaminhamentoId: string,
    acompanhamento: AcompanhamentoEncaminhamento,
  ) => void
  salvarAtividade: (atividade: Atividade) => void
}

const EducandosContext = createContext<EducandosContextValue | null>(null)

export function GestaoEducandosProvider({ children }: { children: ReactNode }) {
  const [educandos, setEducandos] = useState<Educando[]>([])
  const educandosAtuais = useRef<Educando[]>([])
  const [cargaEducandos, setCargaEducandos] =
    useState<CargaEducandos>("ociosa")
  const cargaAtual = useRef<CargaEducandos>("ociosa")
  const [erroEducandos, setErroEducandos] = useState<string | null>(null)
  const [atendimentos, setAtendimentos] = useState(atendimentosSeed)
  const [encaminhamentos, setEncaminhamentos] = useState(encaminhamentosSeed)
  const [atividades, setAtividades] = useState(atividadesSeed)
  const atividadesAtuais = useRef(atividadesSeed)

  const iniciativaNome = useCallback(
    (id: string) =>
      iniciativasSeed.find((iniciativa) => iniciativa.id === id)?.nome ?? "—",
    [],
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
  }, [aplicarEducandos])

  const carregarEducando = useCallback(
    async (id: string) => {
      if (!ehIdPersistido(id)) return
      mesclarEducando(deEducandoApi(await api.buscarEducando(Number(id))))
    },
    [mesclarEducando],
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

  const salvarAtividade = useCallback((registro: Atividade) => {
    // Mesmo padrão de salvarEducando: a validação lança erro de forma síncrona.
    const proximas = salvarAtividadeEmMemoria(atividadesAtuais.current, registro)
    atividadesAtuais.current = proximas
    setAtividades(proximas)
  }, [])

  const value = useMemo<EducandosContextValue>(
    () => ({
      iniciativas: iniciativasSeed,
      educandos,
      cargaEducandos,
      erroEducandos,
      carregarEducandos,
      carregarEducando,
      atendimentos,
      encaminhamentos,
      atividades,
      encontros: encontrosSeed,
      iniciativaNome,
      salvarEducando,
      alternarSituacaoEducando,
      registrarEvolucao,
      registrarEncaminhamento,
      registrarAcompanhamento,
      salvarAtividade,
    }),
    [
      educandos,
      cargaEducandos,
      erroEducandos,
      carregarEducandos,
      carregarEducando,
      atendimentos,
      encaminhamentos,
      atividades,
      salvarAtividade,
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
