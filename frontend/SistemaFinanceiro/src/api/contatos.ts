import { recurso } from "./recurso";
import type { Contato, NovoContato } from "@/types/financeiro";

const api = recurso<Contato, NovoContato>("/api/contatos");

export const getContatos = api.listar;
export const createContato = api.criar;
export const updateContato = api.atualizar;
