import { recurso } from "./recurso";
import { normalizarOrcamento } from "./normalizar";
import type { Orcamento } from "@/types/financeiro";

// Por enquanto só leitura (usado no relatório de execução orçamentária).
const api = recurso<Orcamento, never, Parameters<typeof normalizarOrcamento>[0]>("/api/orcamentos", normalizarOrcamento);

export const getOrcamentos = api.listar;
