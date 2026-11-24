// Indicadores do painel da Gestão (US05, RF15, RF16). Função pura: recebe os
// registros já filtrados por organização, período e iniciativa e calcula.
//
// RN07: os indicadores usam só os registros que atendem aos filtros.
// RN08: atendimentos (evoluções) e encontros realizados são contados à parte.
// RN05: encontro cancelado (ou só agendado) não conta como realizado.
//
// Definições:
// - Encontros realizados: encontros com situação "realizado" no período.
// - Frequência média: presenças ÷ (presenças + ausências) nos encontros
//   realizados. Sem chamada registrada, fica null.
// - Atendimentos registrados: evoluções com data no período. Contam para uma
//   iniciativa quando foram registradas nela (projetoId) ou, sem iniciativa
//   própria, quando o educando tem vínculo com ela.
// - Educandos atendidos: educandos distintos com presença em encontro
//   realizado ou com atendimento no período.
import { PRESENCA } from '../atividades/regras-atividades';

export interface IniciativaPainel {
  id: number;
  nome: string;
  tipo: string;
  orcamentoTotal?: unknown;
}

export interface EncontroPainel {
  atividade: { projetoId: number };
  frequencias: { educandoId: number; presencaAusencia: string }[];
}

export interface EvolucaoPainel {
  educandoId: number;
  projetoId: number | null;
  educando: { educandoProjetos: { projetoId: number }[] };
}

export interface Indicadores {
  educandosAtendidos: number;
  atendimentosRegistrados: number;
  encontrosRealizados: number;
  presencas: number;
  ausencias: number;
  // 0 a 1; null sem chamada registrada.
  frequenciaMedia: number | null;
}

export interface LinhaIniciativa extends Indicadores {
  id: number;
  nome: string;
  tipo: string;
  // Só para quem vê orçamento (PERFIS_VEEM_ORCAMENTO_INICIATIVA).
  orcamentoTotal?: number | null;
}

export interface ResultadoPainel {
  totais: Indicadores & { orcamentoTotal?: number | null };
  porIniciativa: LinhaIniciativa[];
}

function indicadores(
  encontros: EncontroPainel[],
  evolucoes: EvolucaoPainel[],
): Indicadores {
  let presencas = 0;
  let ausencias = 0;
  const atendidos = new Set<number>();

  for (const encontro of encontros) {
    for (const f of encontro.frequencias) {
      if (f.presencaAusencia === PRESENCA) {
        presencas += 1;
        atendidos.add(f.educandoId);
      } else {
        ausencias += 1;
      }
    }
  }
  for (const evolucao of evolucoes) atendidos.add(evolucao.educandoId);

  const chamadas = presencas + ausencias;
  return {
    educandosAtendidos: atendidos.size,
    atendimentosRegistrados: evolucoes.length,
    encontrosRealizados: encontros.length,
    presencas,
    ausencias,
    frequenciaMedia: chamadas === 0 ? null : presencas / chamadas,
  };
}

function pertenceAIniciativa(evolucao: EvolucaoPainel, iniciativaId: number) {
  if (evolucao.projetoId !== null) return evolucao.projetoId === iniciativaId;
  return evolucao.educando.educandoProjetos.some(
    (v) => v.projetoId === iniciativaId,
  );
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

export function calcularPainel(
  iniciativas: IniciativaPainel[],
  encontros: EncontroPainel[],
  evolucoes: EvolucaoPainel[],
  comOrcamento: boolean,
): ResultadoPainel {
  const porIniciativa = [...iniciativas]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((iniciativa) => {
      const linha: LinhaIniciativa = {
        id: iniciativa.id,
        nome: iniciativa.nome,
        tipo: iniciativa.tipo,
        ...indicadores(
          encontros.filter((e) => e.atividade.projetoId === iniciativa.id),
          evolucoes.filter((e) => pertenceAIniciativa(e, iniciativa.id)),
        ),
      };
      if (comOrcamento) linha.orcamentoTotal = numero(iniciativa.orcamentoTotal);
      return linha;
    });

  const totais: ResultadoPainel['totais'] = indicadores(encontros, evolucoes);
  if (comOrcamento) {
    const valores = porIniciativa
      .map((l) => l.orcamentoTotal)
      .filter((v): v is number => typeof v === 'number');
    totais.orcamentoTotal = valores.length
      ? valores.reduce((soma, v) => soma + v, 0)
      : null;
  }
  return { totais, porIniciativa };
}

// Período em datas "AAAA-MM-DD" do calendário de Brasília (UTC-3, sem horário
// de verão desde 2019) -> intervalo [início, fim) em instantes.
export function intervaloDoPeriodo(inicio: string, fim: string) {
  const desde = new Date(`${inicio}T00:00:00-03:00`);
  const ate = new Date(`${fim}T00:00:00-03:00`);
  ate.setUTCDate(ate.getUTCDate() + 1);
  return { desde, ate };
}
