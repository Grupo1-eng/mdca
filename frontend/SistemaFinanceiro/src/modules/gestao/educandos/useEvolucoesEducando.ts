import { useCallback, useEffect, useState } from "react"
import * as api from "../api/evolucoes"
import { ehIdPersistido } from "../api/educandosMapper"
import {
  deEncaminhamentoApi,
  deEvolucaoApi,
  paraAcompanhamentoPayload,
  paraEncaminhamentoPayload,
  paraEvolucaoPayload,
  type FormAtendimento,
} from "../api/evolucoesMapper"
import type { Atendimento, Encaminhamento, StatusEncaminhamento } from "./types"

export type CargaLinhaDoTempo = "carregando" | "pronta" | "erro"

// Linha do tempo (atendimentos e encaminhamentos) de um educando, lida da API
// real. Cada gravação relê a lista, para refletir o que o servidor guardou.
export function useEvolucoesEducando(educandoId: string, ativo: boolean) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([])
  const [carga, setCarga] = useState<CargaLinhaDoTempo>("carregando")
  const [erro, setErro] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    const id = Number(educandoId)
    const [evolucoes, encs] = await Promise.all([
      api.listarEvolucoes(id),
      api.listarEncaminhamentos(id),
    ])
    setAtendimentos(evolucoes.map(deEvolucaoApi))
    setEncaminhamentos(encs.map(deEncaminhamentoApi))
  }, [educandoId])

  const recarregar = useCallback(() => {
    if (!ativo || !ehIdPersistido(educandoId)) return
    setCarga("carregando")
    setErro(null)
    buscar()
      .then(() => setCarga("pronta"))
      .catch((e: unknown) => {
        setCarga("erro")
        setErro(e instanceof Error ? e.message : "Não foi possível carregar a linha do tempo.")
      })
  }, [ativo, educandoId, buscar])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const registrarAtendimento = useCallback(
    async (form: FormAtendimento) => {
      await api.criarEvolucao(paraEvolucaoPayload(educandoId, form))
      await buscar()
    },
    [educandoId, buscar],
  )

  const registrarEncaminhamento = useCallback(
    async (form: { destino: string; motivo: string }) => {
      await api.criarEncaminhamento(paraEncaminhamentoPayload(educandoId, form))
      await buscar()
    },
    [educandoId, buscar],
  )

  const registrarAcompanhamento = useCallback(
    async (
      encaminhamentoId: string,
      form: { data: string; situacao: StatusEncaminhamento; observacao: string },
    ) => {
      await api.criarAcompanhamento(paraAcompanhamentoPayload(encaminhamentoId, form))
      await buscar()
    },
    [buscar],
  )

  return {
    atendimentos,
    encaminhamentos,
    carga,
    erro,
    recarregar,
    registrarAtendimento,
    registrarEncaminhamento,
    registrarAcompanhamento,
  }
}
