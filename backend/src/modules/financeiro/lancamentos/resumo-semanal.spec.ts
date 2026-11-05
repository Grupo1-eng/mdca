import { LancamentoParaResumo, resumoSemanalDoMes } from './resumo-semanal';

function lanc(
  tipo: string,
  valor: string,
  competencia: string | null,
  extra: Partial<LancamentoParaResumo> = {},
): LancamentoParaResumo {
  return {
    tipo,
    valor,
    dataCompetencia: competencia ? new Date(`${competencia}T00:00:00.000Z`) : null,
    dataPagamento: null,
    criadoEm: new Date('2020-01-01T00:00:00.000Z'),
    ...extra,
  };
}

describe('resumoSemanalDoMes', () => {
  it('divide o mês em semanas de 7 dias a partir do dia 1', () => {
    const { semanas } = resumoSemanalDoMes('2026-11', []);

    expect(semanas.map((s) => [s.semana, s.inicio, s.fim])).toEqual([
      [1, '2026-11-01', '2026-11-07'],
      [2, '2026-11-08', '2026-11-14'],
      [3, '2026-11-15', '2026-11-21'],
      [4, '2026-11-22', '2026-11-28'],
      [5, '2026-11-29', '2026-11-30'],
    ]);
  });

  it('ajusta o número de semanas ao tamanho do mês', () => {
    expect(resumoSemanalDoMes('2027-02', []).semanas).toHaveLength(4);
    expect(resumoSemanalDoMes('2028-02', []).semanas).toHaveLength(5);
    const dezembro = resumoSemanalDoMes('2026-12', []).semanas;
    expect(dezembro[4]).toMatchObject({ inicio: '2026-12-29', fim: '2026-12-31' });
  });

  it('mantém as semanas sem lançamento zeradas', () => {
    const { semanas, totais } = resumoSemanalDoMes('2026-11', []);

    expect(semanas.every((s) => s.entradas === '0.00' && s.saidas === '0.00' && s.saldo === '0.00')).toBe(true);
    expect(totais).toEqual({ entradas: '0.00', saidas: '0.00', saldo: '0.00' });
  });

  it('coloca cada lançamento na semana do seu dia, inclusive nas bordas', () => {
    const { semanas } = resumoSemanalDoMes('2026-11', [
      lanc('entrada', '10.00', '2026-11-01'),
      lanc('entrada', '20.00', '2026-11-07'),
      lanc('entrada', '30.00', '2026-11-08'),
      lanc('entrada', '40.00', '2026-11-29'),
      lanc('entrada', '50.00', '2026-11-30'),
    ]);

    expect(semanas.map((s) => s.entradas)).toEqual(['30.00', '30.00', '0.00', '0.00', '90.00']);
  });

  it('separa entradas e saídas e calcula o saldo de cada semana e do mês', () => {
    const { semanas, totais } = resumoSemanalDoMes('2026-11', [
      lanc('entrada', '1000.00', '2026-11-03'),
      lanc('saida', '250.50', '2026-11-04'),
      lanc('saida', '800.00', '2026-11-10'),
    ]);

    expect(semanas[0]).toMatchObject({ entradas: '1000.00', saidas: '250.50', saldo: '749.50' });
    expect(semanas[1]).toMatchObject({ entradas: '0.00', saidas: '800.00', saldo: '-800.00' });
    expect(totais).toEqual({ entradas: '1000.00', saidas: '1050.50', saldo: '-50.50' });
  });

  it('soma em centavos, sem erro de ponto flutuante', () => {
    const { totais } = resumoSemanalDoMes('2026-11', [
      lanc('entrada', '0.10', '2026-11-02'),
      lanc('entrada', '0.20', '2026-11-02'),
    ]);

    expect(totais.entradas).toBe('0.30');
  });

  it('usa a data de competência, senão a de pagamento, senão a de criação', () => {
    const { semanas } = resumoSemanalDoMes('2026-11', [
      lanc('entrada', '1.00', '2026-11-02', { dataPagamento: new Date('2026-11-25T00:00:00.000Z') }),
      lanc('entrada', '2.00', null, { dataPagamento: new Date('2026-11-09T00:00:00.000Z') }),
      lanc('entrada', '4.00', null, { criadoEm: new Date('2026-11-16T00:00:00.000Z') }),
    ]);

    expect(semanas.map((s) => s.entradas)).toEqual(['1.00', '2.00', '4.00', '0.00', '0.00']);
  });

  it('ignora lançamentos de outros meses e de tipo desconhecido', () => {
    const { totais } = resumoSemanalDoMes('2026-11', [
      lanc('entrada', '100.00', '2026-10-31'),
      lanc('entrada', '100.00', '2026-12-01'),
      lanc('transferencia', '100.00', '2026-11-10'),
    ]);

    expect(totais).toEqual({ entradas: '0.00', saidas: '0.00', saldo: '0.00' });
  });
});
