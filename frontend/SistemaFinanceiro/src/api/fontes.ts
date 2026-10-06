import { recurso } from "./recurso";
import type { Fonte, NovaFonte } from "@/types/financeiro";

const api = recurso<Fonte, NovaFonte>("/api/fontes-de-recurso");

export const getFontes = api.listar;
export const createFonte = api.criar;
export const updateFonte = api.atualizar;
