// Fluxo de gravação de um educando na API real. Fica fora do contexto React
// para poder ser testado com uma API falsa.
import { salvarEducandoEmMemoria } from "../educandos/model"
import type { Educando } from "../educandos/types"
import * as apiReal from "./educandos"
import {
  deEducandoApi,
  ehIdPersistido,
  paraEducandoPayload,
  planejarVinculo,
  responsaveisParaSalvar,
} from "./educandosMapper"

export type ChamadasEducandos = Pick<
  typeof apiReal,
  | "criarEducando"
  | "atualizarEducando"
  | "buscarEducando"
  | "criarResponsavel"
  | "atualizarResponsavel"
  | "criarVinculo"
  | "atualizarVinculo"
  | "encerrarVinculo"
>

// 1. Valida tudo localmente, antes de qualquer requisição: CPF/NIS duplicado
//    (o backend também confere e responde 409), nome, renda e responsáveis.
// 2. Cria ou atualiza o educando.
// 3. Cria os responsáveis novos e atualiza os existentes.
// 4. Cria, atualiza ou encerra o vínculo com a iniciativa.
// 5. Relê a ficha para devolver responsáveis e vínculo com os ids definitivos.
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

  const anterior = existentes.find((item) => item.id === registro.id)
  for (const acao of planejarVinculo(anterior, registro)) {
    if (acao.tipo === "encerrar") await api.encerrarVinculo(acao.id)
    else if (acao.tipo === "atualizar") await api.atualizarVinculo(acao.id, acao.dataIngresso)
    else
      await api.criarVinculo({
        educandoId: salvo.id,
        projetoId: acao.projetoId,
        dataIngresso: acao.dataIngresso,
      })
  }

  return deEducandoApi(await api.buscarEducando(salvo.id))
}
