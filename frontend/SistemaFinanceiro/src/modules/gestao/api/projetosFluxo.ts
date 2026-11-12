import { listarProjetos, organizacaoIdDoToken } from "./projetos"
import { daOrganizacao, deProjetoApi, type IniciativaTela } from "./projetosMapper"

export async function carregarIniciativas(): Promise<{
  iniciativas: IniciativaTela[]
  separaOrganizacao: boolean
}> {
  const organizacaoId = organizacaoIdDoToken()
  const lista = (await listarProjetos()).map(deProjetoApi)
  return {
    iniciativas: daOrganizacao(lista, organizacaoId),
    separaOrganizacao: organizacaoId !== null,
  }
}
