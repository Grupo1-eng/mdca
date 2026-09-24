import { useApiResource } from "./useApiResource";
import { getCategorias, createCategoria, updateCategoria } from "@/api/categorias";
import type { Categoria, NovaCategoria } from "@/types/financeiro";

const api = { list: getCategorias, create: createCategoria, update: updateCategoria };

export function useCategorias() {
  return useApiResource<Categoria, NovaCategoria, Partial<NovaCategoria>>(api);
}
