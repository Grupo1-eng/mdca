import { useFetch } from "./useFetch";
import { getOrcamentos } from "@/api/orcamentos";
import type { Orcamento } from "@/types/financeiro";

const vazio: Orcamento[] = [];

export function useOrcamentos() {
  return useFetch<Orcamento[]>(getOrcamentos, vazio);
}
