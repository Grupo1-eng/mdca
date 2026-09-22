import { request, requestForm } from "./client";
import type { Anexo } from "@/types/financeiro";

export function getAnexos(lancamentoId: string): Promise<Anexo[]> {
  return request<Anexo[]>(`/financeiro/lancamentos/${lancamentoId}/anexos`);
}

export function createAnexo(lancamentoId: string, file: File): Promise<Anexo> {
  const form = new FormData();
  form.append("file", file);
  return requestForm<Anexo>(`/financeiro/lancamentos/${lancamentoId}/anexos`, form);
}

export function removeAnexo(anexoId: string): Promise<void> {
  return request<void>(`/financeiro/anexos/${anexoId}`, { method: "DELETE" });
}
