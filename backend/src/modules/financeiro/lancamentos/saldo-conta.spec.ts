import { Prisma } from '@prisma/client';
import { efeitoNoSaldo } from './saldo-conta';

// US02 / RF25 / RF64: só lançamentos realizados (pagos ou recebidos) mexem no
// saldo da conta; entrada soma e saída subtrai.
describe('efeitoNoSaldo', () => {
  const valor = new Prisma.Decimal('150.75');

  it('entrada recebida soma o valor', () => {
    expect(
      efeitoNoSaldo({
        tipo: 'entrada',
        situacao: 'recebido',
        valor,
      }).toString(),
    ).toBe('150.75');
  });

  it('saída paga subtrai o valor', () => {
    expect(efeitoNoSaldo({ tipo: 'saida', situacao: 'pago', valor }).toString()).toBe('-150.75');
  });

  it('lançamento pendente não mexe no saldo', () => {
    expect(efeitoNoSaldo({ tipo: 'entrada', situacao: 'pendente', valor }).isZero()).toBe(true);
    expect(efeitoNoSaldo({ tipo: 'saida', situacao: 'pendente', valor }).isZero()).toBe(true);
  });

  it('aceita valor em texto sem perder centavos', () => {
    expect(
      efeitoNoSaldo({
        tipo: 'saida',
        situacao: 'pago',
        valor: '0.10',
      }).toString(),
    ).toBe('-0.1');
  });
});
