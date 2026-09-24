import { useApiResource } from "./useApiResource";
import { getContatos, createContato, updateContato } from "@/api/contatos";
import type { Contato, NovoContato } from "@/types/financeiro";

const api = { list: getContatos, create: createContato, update: updateContato };

export function useContatos() {
  return useApiResource<Contato, NovoContato, Partial<NovoContato>>(api);
}
