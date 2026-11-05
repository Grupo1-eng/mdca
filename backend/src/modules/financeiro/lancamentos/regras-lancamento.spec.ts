import { situacaoCompativel } from './regras-lancamento';

// Entrada se realiza ao ser recebida; saída, ao ser paga.
describe('situacaoCompativel', () => {
  it('entrada aceita pendente e recebido', () => {
    expect(situacaoCompativel('entrada', 'pendente')).toBe(true);
    expect(situacaoCompativel('entrada', 'recebido')).toBe(true);
    expect(situacaoCompativel('entrada', 'pago')).toBe(false);
  });

  it('saída aceita pendente e pago', () => {
    expect(situacaoCompativel('saida', 'pendente')).toBe(true);
    expect(situacaoCompativel('saida', 'pago')).toBe(true);
    expect(situacaoCompativel('saida', 'recebido')).toBe(false);
  });
});
