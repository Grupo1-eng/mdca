// O Prisma serializa colunas Decimal como texto ("150.75"). Aqui elas viram
// number para a tela exibir e somar; o envio continua como texto (ver tipos
// Nov* em @/types/financeiro).
import type { Conta, Lancamento, Orcamento, Projeto } from "@/types/financeiro";

type Decimal = string | number;
type ComDecimal<T, K extends keyof T> = Omit<T, K> & { [P in K]: null extends T[P] ? Decimal | null : Decimal };

function numero(valor: Decimal): number {
  return Number(valor);
}

function numeroOuNulo(valor: Decimal | null): number | null {
  return valor === null ? null : Number(valor);
}

export function normalizarLancamento(api: ComDecimal<Lancamento, "valor">): Lancamento {
  return { ...(api as Lancamento), valor: numero(api.valor) };
}

export function normalizarConta(api: ComDecimal<Conta, "saldoInicial" | "saldoAtual">): Conta {
  return { ...(api as Conta), saldoInicial: numero(api.saldoInicial), saldoAtual: numero(api.saldoAtual) };
}

export function normalizarProjeto(api: ComDecimal<Projeto, "orcamentoTotal">): Projeto {
  return { ...(api as Projeto), orcamentoTotal: numeroOuNulo(api.orcamentoTotal) };
}

export function normalizarOrcamento(api: ComDecimal<Orcamento, "valorPrevisto">): Orcamento {
  return { ...(api as Orcamento), valorPrevisto: numero(api.valorPrevisto) };
}
