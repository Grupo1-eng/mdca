import { useApiResource } from "./useApiResource";
import { getLancamentos, createLancamento, updateLancamento } from "@/api/lancamentos";
import type { Lancamento, NovoLancamento } from "@/types/financeiro";

const api = { list: getLancamentos, create: createLancamento, update: updateLancamento };

export function useLancamentos() {
  return useApiResource<Lancamento, NovoLancamento, Partial<NovoLancamento>>(api);
}
