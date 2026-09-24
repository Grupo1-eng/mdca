import { recurso } from "./recurso";
import type { Categoria, NovaCategoria } from "@/types/financeiro";

const api = recurso<Categoria, NovaCategoria>("/api/categorias-financeiras");

export const getCategorias = api.listar;
export const createCategoria = api.criar;
export const updateCategoria = api.atualizar;
