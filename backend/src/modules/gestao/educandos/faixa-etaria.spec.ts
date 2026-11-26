import { idadeEm, mesmaData, problemaFaixaEtaria } from './faixa-etaria';

// Questionário da MDCA, pergunta 4: público de 6 a 17 anos.
describe('faixa etária do educando', () => {
  const hoje = new Date('2026-11-24T12:00:00.000Z');
  const nascido = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

  it('calcula a idade completa, contando o aniversário', () => {
    expect(idadeEm(nascido('2020-11-24'), hoje)).toBe(6);
    expect(idadeEm(nascido('2020-11-25'), hoje)).toBe(5);
    expect(idadeEm(nascido('2009-01-01'), hoje)).toBe(17);
  });

  it('aceita de 6 a 17 anos, inclusive', () => {
    expect(problemaFaixaEtaria(nascido('2020-11-24'), hoje)).toBeNull();
    expect(problemaFaixaEtaria(nascido('2008-11-25'), hoje)).toBeNull();
  });

  it('recusa menos de 6 anos', () => {
    expect(problemaFaixaEtaria(nascido('2020-11-25'), hoje)).toMatch(
      /de 6 a 17 anos.*tem 5 anos/,
    );
  });

  it('recusa 18 anos ou mais', () => {
    expect(problemaFaixaEtaria(nascido('2008-11-24'), hoje)).toMatch(/tem 18 anos/);
  });

  it('recusa data no futuro', () => {
    expect(problemaFaixaEtaria(nascido('2027-01-01'), hoje)).toBe(
      'A data de nascimento não pode ser no futuro.',
    );
  });

  it('usa "ano" no singular', () => {
    expect(problemaFaixaEtaria(nascido('2025-01-01'), hoje)).toMatch(/tem 1 ano\./);
  });
});

describe('mesmaData', () => {
  it('compara o dia, ignorando o horário', () => {
    expect(mesmaData(new Date('2015-03-10T00:00:00Z'), new Date('2015-03-10T15:00:00Z'))).toBe(true);
    expect(mesmaData(new Date('2015-03-10T00:00:00Z'), new Date('2015-03-11T00:00:00Z'))).toBe(false);
    expect(mesmaData(new Date('2015-03-10T00:00:00Z'), null)).toBe(false);
    expect(mesmaData(null, undefined)).toBe(true);
  });
});
