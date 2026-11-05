// Situações válidas para cada tipo: a entrada se realiza ao ser recebida, a
// saída ao ser paga. Sem essa regra, uma saída "recebida" contava no saldo da
// conta (que olha qualquer situação diferente de pendente), mas não nos
// gráficos nem na execução orçamentária (que olham recebido/pago pelo tipo).
export const SITUACOES_POR_TIPO: Record<string, readonly string[]> = {
  entrada: ['pendente', 'recebido'],
  saida: ['pendente', 'pago'],
};

export function situacaoCompativel(tipo: string, situacao: string): boolean {
  return SITUACOES_POR_TIPO[tipo]?.includes(situacao) ?? false;
}
