import { Prisma } from '@prisma/client';

// US02 / RF25 / RF64: o saldo atual da conta acompanha os lançamentos
// realizados. Pendente ainda não movimentou dinheiro, então não conta.
// O ajuste é incremental (não recalcula do zero) para preservar os ajustes
// manuais de saldo, que a auditoria registra como "ajustar_saldo".

export interface LancamentoNoSaldo {
  tipo: string;
  situacao: string;
  valor: Prisma.Decimal | string | number;
}

/** Quanto o lançamento soma (positivo) ou tira (negativo) do saldo da sua conta. */
export function efeitoNoSaldo(l: LancamentoNoSaldo): Prisma.Decimal {
  if (l.situacao === 'pendente') return new Prisma.Decimal(0);
  const valor = new Prisma.Decimal(l.valor.toString());
  return l.tipo === 'saida' ? valor.negated() : valor;
}

/** Soma `valor` ao saldo atual da conta (negativo subtrai). Valor zero não grava nada. */
export async function ajustarSaldo(
  db: Prisma.TransactionClient,
  contaId: number,
  valor: Prisma.Decimal,
) {
  if (valor.isZero()) return;
  await db.contaFinanceira.update({
    where: { id: contaId },
    data: { saldoAtual: { increment: valor } },
  });
}
