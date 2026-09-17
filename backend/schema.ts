/**
 * Schema do banco (PostgreSQL) — schema `financeiro`.
 *
 * O schema `gestao` fica reservado para o outro grupo (entidades deles
 * entram depois, num arquivo separado). Nenhuma tabela abaixo depende do
 * schema `gestao` neste momento; se o outro grupo criar, por exemplo, uma
 * tabela `gestao.usuarios`, os campos marcados como "TODO FK futura" abaixo
 * (ex: `criadoPorUsuarioId` em lancamentos) podem virar referências reais.
 *
 * Ferramenta: Drizzle ORM (drizzle-orm/pg-core)
 * Instalação: npm i drizzle-orm pg && npm i -D drizzle-kit
 */

import {
  pgSchema,
  uuid,
  text,
  boolean,
  date,
  timestamp,
  numeric,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Schema (namespace do Postgres)
// ---------------------------------------------------------------------------
export const financeiro = pgSchema("financeiro");

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const statusProjetoEnum = pgEnum("status_projeto", [
  "planejado",
  "em_andamento",
  "concluido",
  "cancelado",
]);

export const tipoCategoriaEnum = pgEnum("tipo_categoria", [
  "receita",
  "despesa",
]);

export const tipoLancamentoEnum = pgEnum("tipo_lancamento", [
  "receita",
  "despesa",
]);

export const situacaoLancamentoEnum = pgEnum("situacao_lancamento", [
  "pendente",
  "pago",
  "cancelado",
]);

export const tipoContaEnum = pgEnum("tipo_conta", [
  "corrente",
  "poupanca",
  "caixa",
]);

// ---------------------------------------------------------------------------
// organizacoes
// ---------------------------------------------------------------------------
export const organizacoes = financeiro.table("organizacoes", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  ativa: boolean("ativa").notNull().default(true),
  dataFundacao: date("data_fundacao"),
  email: text("email"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  // "cnpg" veio assim do diagrama original — confirmar se não é "cnpj" antes de migrar
  cnpg: text("cnpg"),
});

// ---------------------------------------------------------------------------
// usuarios  (1 organizacao -> N usuarios)
// ---------------------------------------------------------------------------
export const usuarios = financeiro.table(
  "usuarios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizacaoId: uuid("organizacao_id")
      .notNull()
      .references(() => organizacoes.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    senhaHash: text("senha_hash").notNull(),
    perfil: text("perfil").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    orgIdx: index("usuarios_organizacao_id_idx").on(t.organizacaoId),
  }),
);

// ---------------------------------------------------------------------------
// contatos
// ---------------------------------------------------------------------------
export const contatos = financeiro.table("contatos", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  observacoes: text("observacoes"),
  telefone: text("telefone"),
  cpfCnpj: text("cpf_cnpj"),
  papel: text("papel"),
  tipo: text("tipo"),
});

// ---------------------------------------------------------------------------
// categorias_financeiras (+ autorrelacionamento N:N subcategoriza)
// ---------------------------------------------------------------------------
export const categoriasFinanceiras = financeiro.table("categorias_financeiras", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  tipo: tipoCategoriaEnum("tipo").notNull(),
  ativa: boolean("ativa").notNull().default(true),
});

// "subcategoriza": (0,n)-(0,n) entre CategoriaFinanceira e ela mesma -> tabela associativa
export const categoriaSubcategoria = financeiro.table(
  "categoria_subcategoria",
  {
    categoriaPaiId: uuid("categoria_pai_id")
      .notNull()
      .references(() => categoriasFinanceiras.id, { onDelete: "cascade" }),
    categoriaFilhaId: uuid("categoria_filha_id")
      .notNull()
      .references(() => categoriasFinanceiras.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.categoriaPaiId, t.categoriaFilhaId] }),
  }),
);

// ---------------------------------------------------------------------------
// fontes_recurso  (Contato origina 0..1 -> N FonteDeRecurso)
// ---------------------------------------------------------------------------
export const fontesRecurso = financeiro.table(
  "fontes_recurso",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nome: text("nome").notNull(),
    origem: text("origem"),
    ativa: boolean("ativa").notNull().default(true),
    contatoOrigemId: uuid("contato_origem_id").references(() => contatos.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    contatoIdx: index("fontes_recurso_contato_origem_idx").on(t.contatoOrigemId),
  }),
);

// ---------------------------------------------------------------------------
// contas_financeiras  (1 organizacao -> N contas)
// ---------------------------------------------------------------------------
export const contasFinanceiras = financeiro.table(
  "contas_financeiras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizacaoId: uuid("organizacao_id")
      .notNull()
      .references(() => organizacoes.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    numero: text("numero"),
    agencia: text("agencia"),
    banco: text("banco"),
    tipo: tipoContaEnum("tipo"),
    saldoInicial: numeric("saldo_inicial", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    saldoAtual: numeric("saldo_atual", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    ativa: boolean("ativa").notNull().default(true),
  },
  (t) => ({
    orgIdx: index("contas_financeiras_organizacao_id_idx").on(t.organizacaoId),
  }),
);

// ---------------------------------------------------------------------------
// projetos
//   -> organizacao (N:1, mandatória)
//   -> responsavel_usuario (N:1, mandatória)
//   -> fonte_recurso (N:1, mandatória)
// ---------------------------------------------------------------------------
export const projetos = financeiro.table(
  "projetos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizacaoId: uuid("organizacao_id")
      .notNull()
      .references(() => organizacoes.id, { onDelete: "cascade" }),
    responsavelUsuarioId: uuid("responsavel_usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    fonteRecursoId: uuid("fonte_recurso_id")
      .notNull()
      .references(() => fontesRecurso.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    status: statusProjetoEnum("status").notNull().default("planejado"),
    orcamentoTotal: numeric("orcamento_total", { precision: 14, scale: 2 }),
    dataInicio: date("data_inicio"),
    dataFim: date("data_fim"),
  },
  (t) => ({
    orgIdx: index("projetos_organizacao_id_idx").on(t.organizacaoId),
    responsavelIdx: index("projetos_responsavel_usuario_id_idx").on(
      t.responsavelUsuarioId,
    ),
    fonteRecursoIdx: index("projetos_fonte_recurso_id_idx").on(t.fonteRecursoId),
  }),
);

// ---------------------------------------------------------------------------
// orcamentos
//   -> projeto (N:1, mandatória)
//   -> categoria_financeira (N:1, mandatória)
// ---------------------------------------------------------------------------
export const orcamentos = financeiro.table(
  "orcamentos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projetoId: uuid("projeto_id")
      .notNull()
      .references(() => projetos.id, { onDelete: "cascade" }),
    categoriaFinanceiraId: uuid("categoria_financeira_id")
      .notNull()
      .references(() => categoriasFinanceiras.id, { onDelete: "restrict" }),
    periodoReferencia: text("periodo_referencia"),
    valorPrevisto: numeric("valor_previsto", { precision: 14, scale: 2 }).notNull(),
  },
  (t) => ({
    projetoIdx: index("orcamentos_projeto_id_idx").on(t.projetoId),
    categoriaIdx: index("orcamentos_categoria_financeira_id_idx").on(
      t.categoriaFinanceiraId,
    ),
  }),
);

// ---------------------------------------------------------------------------
// lancamentos
//   -> conta_financeira (N:1, mandatória)
//   -> categoria_financeira (N:1, mandatória)
//   -> usuario "cria" (N:1, mandatória)
//   -> projeto "gera" (N:1, opcional)
//   -> fonte_recurso "vincula" (N:1, opcional)
//   -> contato "refere-se" (N:1, opcional)
// ---------------------------------------------------------------------------
export const lancamentos = financeiro.table(
  "lancamentos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contaFinanceiraId: uuid("conta_financeira_id")
      .notNull()
      .references(() => contasFinanceiras.id, { onDelete: "restrict" }),
    categoriaFinanceiraId: uuid("categoria_financeira_id")
      .notNull()
      .references(() => categoriasFinanceiras.id, { onDelete: "restrict" }),
    criadoPorUsuarioId: uuid("criado_por_usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    projetoId: uuid("projeto_id").references(() => projetos.id, {
      onDelete: "set null",
    }),
    fonteRecursoId: uuid("fonte_recurso_id").references(() => fontesRecurso.id, {
      onDelete: "set null",
    }),
    contatoId: uuid("contato_id").references(() => contatos.id, {
      onDelete: "set null",
    }),
    valor: numeric("valor", { precision: 14, scale: 2 }).notNull(),
    tipo: tipoLancamentoEnum("tipo").notNull(),
    descricao: text("descricao"),
    dataPagamento: date("data_pagamento"),
    dataCompetencia: date("data_competencia"),
    situacao: situacaoLancamentoEnum("situacao").notNull().default("pendente"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    contaIdx: index("lancamentos_conta_financeira_id_idx").on(t.contaFinanceiraId),
    categoriaIdx: index("lancamentos_categoria_financeira_id_idx").on(
      t.categoriaFinanceiraId,
    ),
    criadorIdx: index("lancamentos_criado_por_usuario_id_idx").on(
      t.criadoPorUsuarioId,
    ),
    projetoIdx: index("lancamentos_projeto_id_idx").on(t.projetoId),
  }),
);
