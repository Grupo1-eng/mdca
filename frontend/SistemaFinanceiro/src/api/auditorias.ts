import { request, requestBlob } from "./client";
import type { FiltroAuditoria, PaginaAuditoria } from "@/types/financeiro";

// Somente leitura: o backend grava a auditoria sozinho. Só coordenação e gestão
// financeira têm acesso (os demais perfis recebem 403).

function query(params: Record<string, string | number | undefined>): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== "") busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : "";
}

export function getAuditoria(filtro: FiltroAuditoria, cursor?: number): Promise<PaginaAuditoria> {
  return request<PaginaAuditoria>(`/api/auditorias${query({ ...filtro, cursor })}`);
}

export function getHistorico(recursoTipo: string, recursoId: number | string, cursor?: number): Promise<PaginaAuditoria> {
  return request<PaginaAuditoria>(
    `/api/auditorias/${encodeURIComponent(recursoTipo)}/${encodeURIComponent(String(recursoId))}${query({ cursor })}`,
  );
}

export function exportarAuditoriaCsv(filtro: FiltroAuditoria): Promise<Blob> {
  return requestBlob(`/api/auditorias/exportar${query({ ...filtro })}`);
}
