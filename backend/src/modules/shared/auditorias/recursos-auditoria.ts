import { Alteracoes } from './diferencas';

// Registros do financeiro que geram auditoria e como aparecem no resumo.
const RECURSOS = {
  lancamento: { nome: 'Lançamento', feminino: false },
  conta_financeira: { nome: 'Conta financeira', feminino: true },
  categoria_financeira: { nome: 'Categoria financeira', feminino: true },
  contato: { nome: 'Contato', feminino: false },
  fonte_de_recurso: { nome: 'Fonte de recurso', feminino: true },
  orcamento: { nome: 'Orçamento', feminino: false },
  projeto: { nome: 'Projeto', feminino: false },
  // Só quando a alteração envolve acesso ao financeiro.
  usuario: { nome: 'Usuário', feminino: false },
} as const;

export type RecursoAuditado = keyof typeof RECURSOS;

const VERBOS: Record<string, string> = {
  criar: 'criad',
  atualizar: 'atualizad',
  excluir: 'excluíd',
  inativar: 'inativad',
  reativar: 'reativad',
};

const CAMPOS_SITUACAO = ['situacao', 'status'];
const CAMPOS_ATIVO = ['ativa', 'ativo'];

// As telas usam um PUT genérico; a ação nomeada sai do que mudou, para o log
// distinguir "pagou o lançamento" ou "inativou a conta" de uma edição comum.
export function acaoDeAtualizacao(alteracoes: Alteracoes): string {
  const campos = Object.keys(alteracoes);
  if (campos.includes('perfil')) return 'mudar_perfil';
  if (campos.includes('saldoAtual')) return 'ajustar_saldo';
  if (campos.length !== 1) return 'atualizar';

  const [campo] = campos;
  const alteracao = alteracoes[campo];
  if (CAMPOS_SITUACAO.includes(campo)) return 'mudar_situacao';
  if (CAMPOS_ATIVO.includes(campo) && 'para' in alteracao) {
    return alteracao.para === false ? 'inativar' : 'reativar';
  }
  return 'atualizar';
}

export function resumoAuditoria(
  recursoTipo: RecursoAuditado,
  acao: string,
  registro: Record<string, unknown>,
  alteracoes: Alteracoes,
): string {
  const { nome, feminino } = RECURSOS[recursoTipo];
  const rotulo = typeof registro.nome === 'string' ? ` (${registro.nome})` : '';
  const alvo = `${nome} #${registro.id}${rotulo}`;

  if (acao === 'mudar_situacao') {
    const [campo] = Object.keys(alteracoes);
    const alteracao = alteracoes[campo];
    if ('para' in alteracao) return `${alvo}: situação ${alteracao.de} → ${alteracao.para}`;
  }
  if (acao === 'mudar_perfil') {
    const alteracao = alteracoes.perfil;
    if ('para' in alteracao) return `${alvo}: perfil ${alteracao.de} → ${alteracao.para}`;
  }
  if (acao === 'ajustar_saldo') return `${alvo}: saldo atual ajustado`;

  const verbo = `${VERBOS[acao] ?? 'atualizad'}${feminino ? 'a' : 'o'}`;
  const campos = acao === 'atualizar' ? `: ${Object.keys(alteracoes).join(', ')}` : '';
  return `${alvo} ${verbo}${campos}`;
}
