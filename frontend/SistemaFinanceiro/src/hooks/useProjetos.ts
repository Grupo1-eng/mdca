import { useApiResource } from "./useApiResource";
import { getProjetos, createProjeto, updateProjeto } from "@/api/projetos";
import type { Projeto, NovoProjeto } from "@/types/financeiro";

const api = { list: getProjetos, create: createProjeto, update: updateProjeto };

export function useProjetos() {
  return useApiResource<Projeto, NovoProjeto, Partial<NovoProjeto>>(api);
}
