import { rotuloPerfil, rotuloSituacao } from "./rotulos";
import type { AlteracaoAuditoria, Perfil, SituacaoLancamento, ValorAuditoria } from "@/types/financeiro";

// Mesma regra do backend (PERFIS_AUDITORIA_FINANCEIRO): só eles leem o log.
const PERFIS_AUDITORIA: Perfil[] = ["coordenador", "coordenador_financeiro", "gestor_financeiro"];

export function podeVerAuditoria(perfil: Perfil | undefined): boolean {
  return perfil !== undefined && PERFIS_AUDITORIA.includes(perfil);
}

export const rotuloAcao: Record<string, string> = {
  criar: "Criação",
  atualizar: "Edição",
  excluir: "Exclusão",
  mudar_situacao: "Mudança de situação",
  inativar: "Inativação",
  reativar: "Reativação",
  ajustar_saldo: "Ajuste de saldo",
  mudar_perfil: "Mudança de perfil",
  login: "Login",
  login_falhou: "Login falhou",
  acesso_negado: "Acesso negado",
  exportar: "Exportação",
};

export const corAcao: Record<string, string> = {
  criar: "bg-[#0e7e6e]/10 text-[#0e7e6e]",
  excluir: "bg-red-50 text-red-600",
  inativar: "bg-red-50 text-red-600",
  login_falhou: "bg-amber-50 text-amber-700",
  acesso_negado: "bg-amber-50 text-amber-700",
  mudar_perfil: "bg-violet-100 text-violet-700",
  ajustar_saldo: "bg-violet-100 text-violet-700",
};
export const corAcaoPadrao = "bg-[#1a3a6b]/10 text-[#1a3a6b]";

export const rotuloRecurso: Record<string, string> = {
  lancamento: "Lançamento",
  conta_financeira: "Conta financeira",
  categoria_financeira: "Categoria",
  contato: "Contato",
  fonte_de_recurso: "Fonte de recurso",
  orcamento: "Orçamento",
  projeto: "Projeto",
  usuario: "Usuário",
  rota: "Rota",
  auditoria: "Log de auditoria",
};

const rotuloCampo: Record<string, string> = {
  valor: "Valor",
  tipo: "Tipo",
  descricao: "Descrição",
  situacao: "Situação",
  dataPagamento: "Data de pagamento",
  dataCompetencia: "Data de competência",
  contaId: "Conta",
  categoriaId: "Categoria",
  categoriaPaiId: "Categoria pai",
  projetoId: "Projeto",
  contatoId: "Contato",
  usuarioId: "Usuário",
  nome: "Nome",
  banco: "Banco",
  agencia: "Agência",
  numero: "Número",
  saldoInicial: "Saldo inicial",
  saldoAtual: "Saldo atual",
  ativa: "Ativa",
  ativo: "Ativo",
  papel: "Papel",
  telefone: "Telefone",
  observacoes: "Observações",
  origem: "Origem",
  periodoReferencia: "Período",
  valorPrevisto: "Valor previsto",
  orcamentoTotal: "Orçamento total",
  dataInicio: "Início",
  dataFim: "Fim",
  status: "Status",
  perfil: "Perfil",
  email: "E-mail",
  senha: "Senha",
  filtro: "Filtro",
};

export function nomeCampo(campo: string): string {
  return rotuloCampo[campo] ?? campo;
}

const ISO_COM_HORARIO = /^\d{4}-\d{2}-\d{2}T/;

export function formatarValor(campo: string, valor: ValorAuditoria | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  const texto = String(valor);
  if (campo === "situacao") return rotuloSituacao[texto as SituacaoLancamento] ?? texto;
  if (campo === "perfil") return rotuloPerfil[texto as Perfil] ?? texto;
  if (ISO_COM_HORARIO.test(texto)) return dataCurta(texto);
  return texto;
}

/** "de X para Y", ou só o valor na criação/exclusão. */
export function descreverAlteracao(campo: string, alteracao: AlteracaoAuditoria): string {
  if ("alterado" in alteracao) return "alterado (conteúdo não registrado)";
  const temDe = "de" in alteracao;
  const temPara = "para" in alteracao;
  if (temDe && temPara) return `${formatarValor(campo, alteracao.de)} → ${formatarValor(campo, alteracao.para)}`;
  return formatarValor(campo, temPara ? alteracao.para : alteracao.de);
}

// Datas da auditoria no padrão DD/MM/AAAA.
const dataHoraBrasilia = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Campo só de data (meia-noite UTC no backend): usa a parte AAAA-MM-DD, sem fuso. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso: string): string {
  return dataHoraBrasilia.format(new Date(iso));
}
