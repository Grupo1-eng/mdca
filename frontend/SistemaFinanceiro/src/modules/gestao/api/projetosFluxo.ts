import { listarProjetos } from "./projetos"
import { deProjetoApi, type IniciativaTela } from "./projetosMapper"

// A organização já vem filtrada pelo backend (GET /api/iniciativas).
export async function carregarIniciativas(): Promise<IniciativaTela[]> {
  return (await listarProjetos()).map(deProjetoApi)
}
