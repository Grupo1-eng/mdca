import { useApiResource } from "./useApiResource";
import { getContas, createConta, updateConta } from "@/api/contas";
import type { Conta, NovaConta } from "@/types/financeiro";

const api = { list: getContas, create: createConta, update: updateConta };

export function useContas() {
  return useApiResource<Conta, NovaConta, Partial<NovaConta>>(api);
}
