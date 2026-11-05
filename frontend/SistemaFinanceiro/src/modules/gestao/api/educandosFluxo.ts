// Fluxo de gravação de um educando na API real. Fica fora do contexto React
// para poder ser testado com uma API falsa.
import { salvarEducandoEmMemoria } from "../educandos/model"
import type { Educando } from "../educandos/types"
import * as apiReal from "./educandos"
import {
  deEducandoApi,
  ehIdPersistido,
  paraEducandoPayload,
  responsaveisParaSalvar,
} from "./educandosMapper"

export type ChamadasEducandos = Pick<
  typeof apiReal,
  | "criarEducando"
  | "atualizarEducando"
  | "buscarEducando"
  | "criarResponsavel"
  | "atualizarResponsavel"
>

// 1. Valida tudo localmente, antes de qualquer requisição: CPF/NIS duplicado
//    (o backend também confere e responde 409), nome, renda e responsáveis.
// 2. Cria ou atualiza o educando.
// 3. Cria os responsáveis novos e atualiza os existentes.
// 4. Relê a ficha para devolver os responsáveis com os ids definitivos.
export async function salvarEducandoRemoto(
  registro: Educando,
  existentes: Educando[],
  api: ChamadasEducandos = apiReal,
): Promise<Educando> {
  salvarEducandoEmMemoria(existentes, registro)
  const payload = paraEducandoPayload(registro)
  const responsaveis = responsaveisParaSalvar(registro.responsaveis)

  const salvo = ehIdPersistido(registro.id)
    ? await api.atualizarEducando(Number(registro.id), payload)
    : await api.criarEducando(payload)

  for (const responsavel of responsaveis) {
    const dados = { ...responsavel.dados, educandoId: salvo.id }
    if (responsavel.id === undefined) await api.criarResponsavel(dados)
    else await api.atualizarResponsavel(responsavel.id, dados)
  }

  return deEducandoApi(await api.buscarEducando(salvo.id))
}
