// Painel de indicadores da Gestão (US05): GET /api/painel
// (backend/src/modules/gestao/painel). Só números agregados.
import { request } from "@/api/client"

export interface IndicadoresApi {
  educandosAtendidos: number
  atendimentosRegistrados: number
  encontrosRealizados: number
  presencas: number
  ausencias: number
  // 0 a 1; null sem chamada registrada no período.
  frequenciaMedia: number | null
}

export interface LinhaIniciativaApi extends IndicadoresApi {
  id: number
  nome: string
  // PROJETO | SERVICO | PROGRAMA
  tipo: string
  // Só para a coordenação.
  orcamentoTotal?: number | null
}

export interface PainelApi {
  filtros: { inicio: string; fim: string; iniciativaId: number | null }
  totais: IndicadoresApi & { orcamentoTotal?: number | null }
  porIniciativa: LinhaIniciativaApi[]
}

export interface FiltrosPainel {
  inicio: string
  fim: string
  // "" = todas as iniciativas.
  iniciativaId: string
}

export function consultarPainel(filtros: FiltrosPainel): Promise<PainelApi> {
  const params = new URLSearchParams({ inicio: filtros.inicio, fim: filtros.fim })
  if (filtros.iniciativaId) params.set("iniciativaId", filtros.iniciativaId)
  return request<PainelApi>(`/api/painel?${params.toString()}`)
}
