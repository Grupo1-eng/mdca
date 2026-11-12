import { acaoDeAtualizacao, resumoAuditoria } from './recursos-auditoria';

describe('acaoDeAtualizacao', () => {
  it.each([
    [{ situacao: { de: 'pendente', para: 'pago' } }, 'mudar_situacao'],
    [{ status: { de: 'ativo', para: 'encerrado' } }, 'mudar_situacao'],
    [{ ativa: { de: true, para: false } }, 'inativar'],
    [{ ativa: { de: false, para: true } }, 'reativar'],
    [{ saldoAtual: { de: '1', para: '2' }, nome: { de: 'a', para: 'b' } }, 'ajustar_saldo'],
    [{ situacao: { de: 'pendente', para: 'pago' }, valor: { de: '1', para: '2' } }, 'atualizar'],
    [{ observacoes: { alterado: true as const } }, 'atualizar'],
  ])('%j → %s', (alteracoes, acao) => {
    expect(acaoDeAtualizacao(alteracoes)).toBe(acao);
  });
});

describe('resumoAuditoria', () => {
  it('concorda em gênero e mostra o nome quando o registro tem um', () => {
    expect(resumoAuditoria('categoria_financeira', 'excluir', { id: 2, nome: 'Energia' }, {})).toBe(
      'Categoria financeira #2 (Energia) excluída',
    );
    expect(resumoAuditoria('projeto', 'reativar', { id: 4, nome: 'Oficina' }, {})).toBe('Projeto #4 (Oficina) reativado');
  });
});
