import { recurso } from "./recurso";
import { normalizarProjeto } from "./normalizar";
import type { NovoProjeto, Projeto } from "@/types/financeiro";

// Só consulta: o cadastro e a edição de projetos são feitos pela coordenação
// no módulo Gestão (/api/iniciativas). Ver docs/decisoes.md (2026-11-17).
const api = recurso<Projeto, NovoProjeto, Parameters<typeof normalizarProjeto>[0]>("/api/projetos", normalizarProjeto);

export const getProjetos = api.listar;
