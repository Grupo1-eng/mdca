import { Prisma } from '@prisma/client';
import { diferencas } from './diferencas';

describe('diferencas', () => {
  it('na atualização guarda só os campos que mudaram, com de e para', () => {
    const antes = { id: 1, valor: new Prisma.Decimal('100.00'), situacao: 'pendente', descricao: 'Luz' };
    const depois = { id: 1, valor: new Prisma.Decimal('150.00'), situacao: 'pendente', descricao: 'Luz' };

    expect(diferencas(antes, depois)).toEqual({ valor: { de: '100', para: '150' } });
  });

  it('compara Decimal pelo valor e datas pelo instante', () => {
    const antes = { valor: new Prisma.Decimal('10.50'), dataPagamento: new Date('2026-01-01T00:00:00Z') };
    const depois = { valor: new Prisma.Decimal('10.5'), dataPagamento: new Date('2026-01-01T00:00:00Z') };

    expect(diferencas(antes, depois)).toEqual({});
  });

  it('na criação guarda só "para" e ignora campos vazios, id e criadoEm', () => {
    const criado = { id: 9, nome: 'Caixa', banco: null, ativa: true, criadoEm: new Date() };

    expect(diferencas(null, criado)).toEqual({ nome: { para: 'Caixa' }, ativa: { para: true } });
  });

  it('na exclusão guarda só "de"', () => {
    expect(diferencas({ nome: 'Caixa', tipo: null }, null)).toEqual({ nome: { de: 'Caixa' } });
  });

  it('nunca registra CPF/CNPJ nem senha, nem como alterado', () => {
    const r = diferencas(
      { cpfCnpj: '12345678900', senhaHash: 'a' },
      { cpfCnpj: '98765432100', senhaHash: 'b' },
    );
    expect(r).toEqual({});
  });

  it('telefone e observações aparecem só como alterado', () => {
    const r = diferencas(
      { telefone: '1199999-0000', observacoes: 'x' },
      { telefone: '1188888-0000', observacoes: 'y' },
    );
    expect(r).toEqual({ telefone: { alterado: true }, observacoes: { alterado: true } });
    expect(JSON.stringify(r)).not.toContain('9999');
  });

  it('agência e número da conta mostram só os últimos caracteres', () => {
    const r = diferencas({ agencia: '1234', numero: '0012345-6' }, { agencia: '4321', numero: '0098765-4' });

    expect(r).toEqual({
      agencia: { de: '••34', para: '••21' },
      numero: { de: '••45-6', para: '••65-4' },
    });
  });

  it('ignora relações carregadas junto com o registro', () => {
    expect(diferencas({ conta: { id: 1 } }, { conta: { id: 2 } })).toEqual({});
  });
});
