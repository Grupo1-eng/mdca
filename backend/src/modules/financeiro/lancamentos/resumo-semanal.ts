export const DIAS_POR_SEMANA = 7;

export interface LancamentoParaResumo {
  tipo: string;
  valor: { toString(): string } | string | number;
  dataCompetencia: Date | null;
  dataPagamento: Date | null;
  criadoEm: Date;
}

export interface SemanaResumo {
  semana: number;
  inicio: string;
  fim: string;
  entradas: string;
  saidas: string;
  saldo: string;
}

export interface ResumoSemanal {
  mes: string;
  semanas: SemanaResumo[];
  totais: { entradas: string; saidas: string; saldo: string };
}

/** Primeiro instante do mês e primeiro instante do mês seguinte (exclusivo). */
export function limitesDoMes(mes: string): { inicio: Date; fimExclusivo: Date } {
  const [ano, numeroMes] = mes.split('-').map(Number);
  return {
    inicio: new Date(Date.UTC(ano, numeroMes - 1, 1)),
    fimExclusivo: new Date(Date.UTC(ano, numeroMes, 1)),
  };
}

function diasDoMes(mes: string): number {
  const [ano, numeroMes] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate();
}

/** Data que situa o lançamento no tempo: competência, senão pagamento, senão criação. */
export function dataDoLancamento(l: LancamentoParaResumo): Date {
  return l.dataCompetencia ?? l.dataPagamento ?? l.criadoEm;
}

function emCentavos(valor: LancamentoParaResumo['valor']): number {
  return Math.round(Number(valor.toString()) * 100);
}

function emTexto(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

function dataTexto(mes: string, dia: number): string {
  return `${mes}-${String(dia).padStart(2, '0')}`;
}

export function resumoSemanalDoMes(
  mes: string,
  lancamentos: LancamentoParaResumo[],
): ResumoSemanal {
  const { inicio, fimExclusivo } = limitesDoMes(mes);
  const dias = diasDoMes(mes);

  const semanas = Array.from(
    { length: Math.ceil(dias / DIAS_POR_SEMANA) },
    (_, i) => ({
      semana: i + 1,
      primeiroDia: i * DIAS_POR_SEMANA + 1,
      ultimoDia: Math.min((i + 1) * DIAS_POR_SEMANA, dias),
      entradas: 0,
      saidas: 0,
    }),
  );

  for (const l of lancamentos) {
    const data = dataDoLancamento(l);
    if (data < inicio || data >= fimExclusivo) continue;

    const centavos = emCentavos(l.valor);
    if (!Number.isFinite(centavos)) continue;

    const semana = semanas[Math.floor((data.getUTCDate() - 1) / DIAS_POR_SEMANA)];
    if (l.tipo === 'entrada') semana.entradas += centavos;
    else if (l.tipo === 'saida') semana.saidas += centavos;
  }

  const totalEntradas = semanas.reduce((a, s) => a + s.entradas, 0);
  const totalSaidas = semanas.reduce((a, s) => a + s.saidas, 0);

  return {
    mes,
    semanas: semanas.map((s) => ({
      semana: s.semana,
      inicio: dataTexto(mes, s.primeiroDia),
      fim: dataTexto(mes, s.ultimoDia),
      entradas: emTexto(s.entradas),
      saidas: emTexto(s.saidas),
      saldo: emTexto(s.entradas - s.saidas),
    })),
    totais: {
      entradas: emTexto(totalEntradas),
      saidas: emTexto(totalSaidas),
      saldo: emTexto(totalEntradas - totalSaidas),
    },
  };
}
