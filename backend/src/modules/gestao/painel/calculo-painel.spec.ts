import {
  EncontroPainel,
  EvolucaoPainel,
  calcularPainel,
  intervaloDoPeriodo,
} from './calculo-painel';

describe('cálculo do painel (US05, RF16)', () => {
  const iniciativas = [
    { id: 2, nome: 'Reforço escolar', tipo: 'PROJETO', orcamentoTotal: '1000.50' },
    { id: 1, nome: 'Convivência', tipo: 'SERVICO', orcamentoTotal: null },
  ];

  const encontro = (
    projetoId: number,
    chamada: Array<[number, 'presente' | 'ausente']>,
  ): EncontroPainel => ({
    atividade: { projetoId },
    frequencias: chamada.map(([educandoId, presencaAusencia]) => ({
      educandoId,
      presencaAusencia,
    })),
  });

  const evolucao = (
    educandoId: number,
    projetoId: number | null,
    vinculos: number[] = [],
  ): EvolucaoPainel => ({
    educandoId,
    projetoId,
    educando: { educandoProjetos: vinculos.map((projetoId) => ({ projetoId })) },
  });

  const encontros = [
    encontro(1, [[10, 'presente'], [11, 'ausente']]),
    encontro(1, [[10, 'presente'], [11, 'presente']]),
    encontro(2, [[12, 'ausente']]),
  ];
  const evolucoes = [
    evolucao(10, null, [1]), // sem iniciativa própria: conta pelo vínculo
    evolucao(13, 2), // registrada na iniciativa 2
    evolucao(14, null, []), // sem vínculo: só no total
  ];

  it('calcula os totais com atendimentos e encontros separados (RN08)', () => {
    const { totais } = calcularPainel(iniciativas, encontros, evolucoes, false);
    expect(totais).toEqual({
      educandosAtendidos: 4, // 10 e 11 (presença), 13 e 14 (atendimento); 12 só faltou
      atendimentosRegistrados: 3,
      encontrosRealizados: 3,
      presencas: 3,
      ausencias: 2,
      frequenciaMedia: 3 / 5,
    });
    expect(totais).not.toHaveProperty('orcamentoTotal');
  });

  it('separa por iniciativa, em ordem alfabética', () => {
    const { porIniciativa } = calcularPainel(iniciativas, encontros, evolucoes, false);
    expect(porIniciativa.map((l) => l.nome)).toEqual(['Convivência', 'Reforço escolar']);
    expect(porIniciativa[0]).toMatchObject({
      id: 1,
      encontrosRealizados: 2,
      atendimentosRegistrados: 1,
      educandosAtendidos: 2,
      frequenciaMedia: 3 / 4,
    });
    expect(porIniciativa[1]).toMatchObject({
      id: 2,
      encontrosRealizados: 1,
      atendimentosRegistrados: 1,
      educandosAtendidos: 1, // 13 pelo atendimento; 12 só faltou
      frequenciaMedia: 0,
    });
  });

  it('sem chamada registrada, a frequência é null (não zero)', () => {
    const { totais } = calcularPainel(iniciativas, [encontro(1, [])], [], false);
    expect(totais.encontrosRealizados).toBe(1);
    expect(totais.frequenciaMedia).toBeNull();
  });

  it('com orçamento: por iniciativa e soma do que foi informado', () => {
    const { totais, porIniciativa } = calcularPainel(iniciativas, [], [], true);
    expect(porIniciativa.map((l) => l.orcamentoTotal)).toEqual([null, 1000.5]);
    expect(totais.orcamentoTotal).toBe(1000.5);
  });

  it('período em datas de Brasília vira intervalo [início, fim + 1 dia)', () => {
    const { desde, ate } = intervaloDoPeriodo('2026-11-01', '2026-11-30');
    expect(desde.toISOString()).toBe('2026-11-01T03:00:00.000Z');
    expect(ate.toISOString()).toBe('2026-12-01T03:00:00.000Z');
  });
});
