import { useApiResource } from "./useApiResource";
import { getFontes, createFonte, updateFonte } from "@/api/fontes";
import type { Fonte, NovaFonte } from "@/types/financeiro";

const api = { list: getFontes, create: createFonte, update: updateFonte };

export function useFontes() {
  return useApiResource<Fonte, NovaFonte, Partial<NovaFonte>>(api);
}
