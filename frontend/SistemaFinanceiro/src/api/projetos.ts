import { recurso } from "./recurso";
import { normalizarProjeto } from "./normalizar";
import type { NovoProjeto, Projeto } from "@/types/financeiro";

const api = recurso<Projeto, NovoProjeto, Parameters<typeof normalizarProjeto>[0]>("/api/projetos", normalizarProjeto);

export const getProjetos = api.listar;
export const createProjeto = api.criar;
export const updateProjeto = api.atualizar;
