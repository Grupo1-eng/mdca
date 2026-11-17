import { useApiResource } from "./useApiResource";
import { getProjetos } from "@/api/projetos";
import type { Projeto } from "@/types/financeiro";

// Projetos são só de consulta aqui (cadastro na Gestão). O useApiResource
// exige create/update; como o hook não os expõe, eles nunca são chamados.
const somenteConsulta = () => Promise.reject(new Error("Projetos são cadastrados pela coordenação, no módulo Gestão."));
const api = { list: getProjetos, create: somenteConsulta, update: somenteConsulta };

export function useProjetos() {
  const { data, loading, error, refetch, recarregar } = useApiResource<Projeto>(api);
  return { data, loading, error, refetch, recarregar };
}
