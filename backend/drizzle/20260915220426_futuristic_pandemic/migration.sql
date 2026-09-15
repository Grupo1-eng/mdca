CREATE SCHEMA "financeiro";
--> statement-breakpoint
CREATE TYPE "situacao_lancamento" AS ENUM('pendente', 'pago', 'cancelado');--> statement-breakpoint
CREATE TYPE "status_projeto" AS ENUM('planejado', 'em_andamento', 'concluido', 'cancelado');--> statement-breakpoint
CREATE TYPE "tipo_categoria" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TYPE "tipo_conta" AS ENUM('corrente', 'poupanca', 'caixa');--> statement-breakpoint
CREATE TYPE "tipo_lancamento" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TABLE "financeiro"."categoria_subcategoria" (
	"categoria_pai_id" uuid,
	"categoria_filha_id" uuid,
	CONSTRAINT "categoria_subcategoria_pkey" PRIMARY KEY("categoria_pai_id","categoria_filha_id")
);
--> statement-breakpoint
CREATE TABLE "financeiro"."categorias_financeiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" text NOT NULL,
	"tipo" "tipo_categoria" NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financeiro"."contas_financeiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizacao_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"numero" text,
	"agencia" text,
	"banco" text,
	"tipo" "tipo_conta",
	"saldo_inicial" numeric(14,2) DEFAULT '0' NOT NULL,
	"saldo_atual" numeric(14,2) DEFAULT '0' NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financeiro"."contatos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" text NOT NULL,
	"observacoes" text,
	"telefone" text,
	"cpf_cnpj" text,
	"papel" text,
	"tipo" text
);
--> statement-breakpoint
CREATE TABLE "financeiro"."fontes_recurso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" text NOT NULL,
	"origem" text,
	"ativa" boolean DEFAULT true NOT NULL,
	"contato_origem_id" uuid
);
--> statement-breakpoint
CREATE TABLE "financeiro"."lancamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conta_financeira_id" uuid NOT NULL,
	"categoria_financeira_id" uuid NOT NULL,
	"criado_por_usuario_id" uuid NOT NULL,
	"projeto_id" uuid,
	"fonte_recurso_id" uuid,
	"contato_id" uuid,
	"valor" numeric(14,2) NOT NULL,
	"tipo" "tipo_lancamento" NOT NULL,
	"descricao" text,
	"data_pagamento" date,
	"data_competencia" date,
	"situacao" "situacao_lancamento" DEFAULT 'pendente'::"situacao_lancamento" NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financeiro"."orcamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"projeto_id" uuid NOT NULL,
	"categoria_financeira_id" uuid NOT NULL,
	"periodo_referencia" text,
	"valor_previsto" numeric(14,2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financeiro"."organizacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" text NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"data_fundacao" date,
	"email" text,
	"telefone" text,
	"endereco" text,
	"cnpg" text
);
--> statement-breakpoint
CREATE TABLE "financeiro"."projetos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizacao_id" uuid NOT NULL,
	"responsavel_usuario_id" uuid NOT NULL,
	"fonte_recurso_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"status" "status_projeto" DEFAULT 'planejado'::"status_projeto" NOT NULL,
	"orcamento_total" numeric(14,2),
	"data_inicio" date,
	"data_fim" date
);
--> statement-breakpoint
CREATE TABLE "financeiro"."usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizacao_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"perfil" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contas_financeiras_organizacao_id_idx" ON "financeiro"."contas_financeiras" ("organizacao_id");--> statement-breakpoint
CREATE INDEX "fontes_recurso_contato_origem_idx" ON "financeiro"."fontes_recurso" ("contato_origem_id");--> statement-breakpoint
CREATE INDEX "lancamentos_conta_financeira_id_idx" ON "financeiro"."lancamentos" ("conta_financeira_id");--> statement-breakpoint
CREATE INDEX "lancamentos_categoria_financeira_id_idx" ON "financeiro"."lancamentos" ("categoria_financeira_id");--> statement-breakpoint
CREATE INDEX "lancamentos_criado_por_usuario_id_idx" ON "financeiro"."lancamentos" ("criado_por_usuario_id");--> statement-breakpoint
CREATE INDEX "lancamentos_projeto_id_idx" ON "financeiro"."lancamentos" ("projeto_id");--> statement-breakpoint
CREATE INDEX "orcamentos_projeto_id_idx" ON "financeiro"."orcamentos" ("projeto_id");--> statement-breakpoint
CREATE INDEX "orcamentos_categoria_financeira_id_idx" ON "financeiro"."orcamentos" ("categoria_financeira_id");--> statement-breakpoint
CREATE INDEX "projetos_organizacao_id_idx" ON "financeiro"."projetos" ("organizacao_id");--> statement-breakpoint
CREATE INDEX "projetos_responsavel_usuario_id_idx" ON "financeiro"."projetos" ("responsavel_usuario_id");--> statement-breakpoint
CREATE INDEX "projetos_fonte_recurso_id_idx" ON "financeiro"."projetos" ("fonte_recurso_id");--> statement-breakpoint
CREATE INDEX "usuarios_organizacao_id_idx" ON "financeiro"."usuarios" ("organizacao_id");--> statement-breakpoint
ALTER TABLE "financeiro"."categoria_subcategoria" ADD CONSTRAINT "categoria_subcategoria_pZfjiYxhYtKf_fkey" FOREIGN KEY ("categoria_pai_id") REFERENCES "financeiro"."categorias_financeiras"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "financeiro"."categoria_subcategoria" ADD CONSTRAINT "categoria_subcategoria_FeFDiQQ3vGel_fkey" FOREIGN KEY ("categoria_filha_id") REFERENCES "financeiro"."categorias_financeiras"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "financeiro"."contas_financeiras" ADD CONSTRAINT "contas_financeiras_organizacao_id_organizacoes_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "financeiro"."organizacoes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "financeiro"."fontes_recurso" ADD CONSTRAINT "fontes_recurso_contato_origem_id_contatos_id_fkey" FOREIGN KEY ("contato_origem_id") REFERENCES "financeiro"."contatos"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_conta_financeira_id_contas_financeiras_id_fkey" FOREIGN KEY ("conta_financeira_id") REFERENCES "financeiro"."contas_financeiras"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_4PJdcJvyrWkH_fkey" FOREIGN KEY ("categoria_financeira_id") REFERENCES "financeiro"."categorias_financeiras"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_criado_por_usuario_id_usuarios_id_fkey" FOREIGN KEY ("criado_por_usuario_id") REFERENCES "financeiro"."usuarios"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_projeto_id_projetos_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "financeiro"."projetos"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_fonte_recurso_id_fontes_recurso_id_fkey" FOREIGN KEY ("fonte_recurso_id") REFERENCES "financeiro"."fontes_recurso"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_contato_id_contatos_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "financeiro"."contatos"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "financeiro"."orcamentos" ADD CONSTRAINT "orcamentos_projeto_id_projetos_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "financeiro"."projetos"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "financeiro"."orcamentos" ADD CONSTRAINT "orcamentos_tkRuFbnZtLWZ_fkey" FOREIGN KEY ("categoria_financeira_id") REFERENCES "financeiro"."categorias_financeiras"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "financeiro"."projetos" ADD CONSTRAINT "projetos_organizacao_id_organizacoes_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "financeiro"."organizacoes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "financeiro"."projetos" ADD CONSTRAINT "projetos_responsavel_usuario_id_usuarios_id_fkey" FOREIGN KEY ("responsavel_usuario_id") REFERENCES "financeiro"."usuarios"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "financeiro"."projetos" ADD CONSTRAINT "projetos_fonte_recurso_id_fontes_recurso_id_fkey" FOREIGN KEY ("fonte_recurso_id") REFERENCES "financeiro"."fontes_recurso"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "financeiro"."usuarios" ADD CONSTRAINT "usuarios_organizacao_id_organizacoes_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "financeiro"."organizacoes"("id") ON DELETE CASCADE;