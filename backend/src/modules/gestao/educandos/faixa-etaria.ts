// Público atendido pela MDCA: crianças e adolescentes de 6 a 17 anos
// (questionário da MDCA, pergunta 4). Vale para o cadastro de um educando
// novo; quem já está cadastrado e completou 18 anos continua editável.
export const IDADE_MINIMA = 6;
export const IDADE_MAXIMA = 17;

// Idade completa em `hoje`, pelas datas no calendário (UTC).
export function idadeEm(nascimento: Date, hoje: Date = new Date()): number {
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
  const mes = hoje.getUTCMonth() - nascimento.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) {
    idade -= 1;
  }
  return idade;
}

// Mensagem do problema, ou null se a data está dentro da faixa.
export function problemaFaixaEtaria(
  nascimento: Date,
  hoje: Date = new Date(),
): string | null {
  if (nascimento.getTime() > hoje.getTime()) {
    return 'A data de nascimento não pode ser no futuro.';
  }
  const idade = idadeEm(nascimento, hoje);
  if (idade < IDADE_MINIMA || idade > IDADE_MAXIMA) {
    return `A MDCA atende crianças e adolescentes de ${IDADE_MINIMA} a ${IDADE_MAXIMA} anos. Pela data de nascimento, o educando tem ${idade} ano${idade === 1 ? '' : 's'}.`;
  }
  return null;
}
