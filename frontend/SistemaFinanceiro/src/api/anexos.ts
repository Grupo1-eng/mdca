import { request, requestForm } from "./client";
import type { Anexo } from "@/types/financeiro";

// O backend ainda NÃO tem endpoints de anexo (upload para o R2). As rotas abaixo
// são as previstas, no mesmo padrão /api das demais; a tela de comprovantes fica
// escondida (ANEXOS_DISPONIVEIS em Financeiro.tsx) até elas existirem.
export function getAnexos(lancamentoId: number): Promise<Anexo[]> {
  return request<Anexo[]>(`/api/lancamentos/${lancamentoId}/anexos`);
}

export function createAnexo(lancamentoId: number, file: File): Promise<Anexo> {
  const form = new FormData();
  form.append("file", file);
  return requestForm<Anexo>(`/api/lancamentos/${lancamentoId}/anexos`, form);
}

export function removeAnexo(anexoId: string): Promise<void> {
  return request<void>(`/api/anexos/${anexoId}`, { method: "DELETE" });
}
