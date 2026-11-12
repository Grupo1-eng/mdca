// Iniciativas (projetos, serviços e programas) da organização do usuário,
// lidas de GET /api/iniciativas (backend/src/modules/gestao/iniciativas).
import { request } from "@/api/client"
import type { Iniciativa } from "../educandos/types"

export interface IniciativaApi {
  id: number
  nome: string
  descricao: string | null
  // PROJETO | SERVICO | PROGRAMA
  tipo: string
  // Status do projeto no Financeiro: "Planejamento", "Em andamento", "Concluído".
  status: string
}

const TIPOS: Record<string, Iniciativa["tipo"]> = {
  PROJETO: "Projeto",
  SERVICO: "Serviço",
  PROGRAMA: "Programa",
}

export function deIniciativaApi(api: IniciativaApi): Iniciativa {
  return {
    id: String(api.id),
    // Sem coluna de código no banco: o id identifica a iniciativa (RN11).
    codigo: String(api.id),
    nome: api.nome,
    tipo: TIPOS[api.tipo?.toUpperCase()] ?? "Projeto",
    situacao: api.status?.trim().toLowerCase() === "concluído" ? "Encerrado" : "Ativo",
  }
}

export async function listarIniciativas(): Promise<Iniciativa[]> {
  return (await request<IniciativaApi[]>("/api/iniciativas")).map(deIniciativaApi)
}
