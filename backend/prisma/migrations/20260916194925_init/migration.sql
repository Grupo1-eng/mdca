-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "financeiro";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "gestao";

-- CreateTable
CREATE TABLE "organizacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "data_fundacao" TIMESTAMP(6),
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "organizacao_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto" (
    "id" SERIAL NOT NULL,
    "organizacao_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL,
    "orcamento_total" DECIMAL(65,30),
    "data_inicio" TIMESTAMP(6),
    "data_fim" TIMESTAMP(6),

    CONSTRAINT "projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "recurso_id" TEXT NOT NULL,
    "recurso_tipo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "data_hora" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."educando" (
    "id" SERIAL NOT NULL,
    "organizacao_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "nis" TEXT,
    "cor_autodeclarada" TEXT,
    "data_nascimento" TIMESTAMP(6),
    "endereco" TEXT,
    "telefone" TEXT,
    "escola" TEXT,
    "turno" TEXT,
    "historico_repetencia" TEXT,
    "numeros_pessoas_familias" INTEGER,
    "renda_familiar" DECIMAL(65,30),
    "beneficios_sociais" TEXT,
    "tipo_moradia" TEXT,
    "doenca_cronica" TEXT,
    "medicamento_continuo" TEXT,
    "observacao_saude" TEXT,
    "situacao_atual" TEXT NOT NULL DEFAULT 'ativo',
    "tecnico_responsavel_id" INTEGER,

    CONSTRAINT "educando_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."responsavel_familiar" (
    "id" SERIAL NOT NULL,
    "educando_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "profissao" TEXT,
    "vinculo" TEXT NOT NULL,
    "tipo_trabalho" TEXT,
    "local_trabalho" TEXT,
    "escolaridade" TEXT,
    "telefone" TEXT,

    CONSTRAINT "responsavel_familiar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."educando_projeto" (
    "id" SERIAL NOT NULL,
    "educando_id" INTEGER NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "data_ingresso" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "situacao" TEXT NOT NULL DEFAULT 'ativo',

    CONSTRAINT "educando_projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."atividade" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "responsavel_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "situacao" TEXT NOT NULL DEFAULT 'ativa',

    CONSTRAINT "atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."encontro" (
    "id" SERIAL NOT NULL,
    "atividade_id" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(6),
    "data_fim" TIMESTAMP(6),
    "hora_inicio" TEXT,
    "hora_fim" TEXT,
    "local" TEXT,
    "situacao" TEXT NOT NULL DEFAULT 'agendado',

    CONSTRAINT "encontro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."frequencia" (
    "id" SERIAL NOT NULL,
    "encontro_id" INTEGER NOT NULL,
    "educando_id" INTEGER NOT NULL,
    "presenca_ausencia" TEXT NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "frequencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."evolucao" (
    "id" SERIAL NOT NULL,
    "educando_id" INTEGER NOT NULL,
    "projeto_id" INTEGER,
    "profissional_id" INTEGER NOT NULL,
    "titulo" TEXT,
    "tipo" TEXT,
    "descricao" TEXT,
    "data_inicio" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(6),
    "situacao" TEXT NOT NULL DEFAULT 'aberta',

    CONSTRAINT "evolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."encaminhamento" (
    "id" SERIAL NOT NULL,
    "educando_id" INTEGER NOT NULL,
    "evolucao_id" INTEGER,
    "data_encaminhamento" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "situacao_atual" TEXT NOT NULL DEFAULT 'em andamento',

    CONSTRAINT "encaminhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."acompanhamento_encaminhamento" (
    "id" SERIAL NOT NULL,
    "encaminhamento_id" INTEGER NOT NULL,
    "situacao" TEXT NOT NULL,
    "data" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,

    CONSTRAINT "acompanhamento_encaminhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao"."compromisso" (
    "id" SERIAL NOT NULL,
    "criador_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT,
    "descricao" TEXT,
    "data_inicio" TIMESTAMP(6) NOT NULL,
    "data_fim" TIMESTAMP(6),
    "situacao" TEXT NOT NULL DEFAULT 'agendado',

    CONSTRAINT "compromisso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."contato" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "papel" TEXT,
    "cpf_cnpj" TEXT,
    "telefone" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "contato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."categoria_financeira" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria_pai_id" INTEGER,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."conta_financeira" (
    "id" SERIAL NOT NULL,
    "organizacao_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "numero" TEXT,
    "saldo_inicial" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldo_atual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "conta_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."fonte_de_recurso" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "origem" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fonte_de_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."lancamento" (
    "id" SERIAL NOT NULL,
    "conta_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "projeto_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "contato_id" INTEGER,
    "valor" DECIMAL(65,30) NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "data_pagamento" TIMESTAMP(6),
    "data_competencia" TIMESTAMP(6),
    "situacao" TEXT NOT NULL DEFAULT 'pendente',
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."orcamento" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "periodo_referencia" TEXT NOT NULL,
    "valor_previsto" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "orcamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."educando" ADD CONSTRAINT "educando_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."educando" ADD CONSTRAINT "educando_tecnico_responsavel_id_fkey" FOREIGN KEY ("tecnico_responsavel_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."responsavel_familiar" ADD CONSTRAINT "responsavel_familiar_educando_id_fkey" FOREIGN KEY ("educando_id") REFERENCES "gestao"."educando"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."educando_projeto" ADD CONSTRAINT "educando_projeto_educando_id_fkey" FOREIGN KEY ("educando_id") REFERENCES "gestao"."educando"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."educando_projeto" ADD CONSTRAINT "educando_projeto_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."atividade" ADD CONSTRAINT "atividade_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."atividade" ADD CONSTRAINT "atividade_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."encontro" ADD CONSTRAINT "encontro_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "gestao"."atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."frequencia" ADD CONSTRAINT "frequencia_encontro_id_fkey" FOREIGN KEY ("encontro_id") REFERENCES "gestao"."encontro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."frequencia" ADD CONSTRAINT "frequencia_educando_id_fkey" FOREIGN KEY ("educando_id") REFERENCES "gestao"."educando"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."evolucao" ADD CONSTRAINT "evolucao_educando_id_fkey" FOREIGN KEY ("educando_id") REFERENCES "gestao"."educando"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."evolucao" ADD CONSTRAINT "evolucao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."evolucao" ADD CONSTRAINT "evolucao_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."encaminhamento" ADD CONSTRAINT "encaminhamento_educando_id_fkey" FOREIGN KEY ("educando_id") REFERENCES "gestao"."educando"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."encaminhamento" ADD CONSTRAINT "encaminhamento_evolucao_id_fkey" FOREIGN KEY ("evolucao_id") REFERENCES "gestao"."evolucao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."acompanhamento_encaminhamento" ADD CONSTRAINT "acompanhamento_encaminhamento_encaminhamento_id_fkey" FOREIGN KEY ("encaminhamento_id") REFERENCES "gestao"."encaminhamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao"."compromisso" ADD CONSTRAINT "compromisso_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."categoria_financeira" ADD CONSTRAINT "categoria_financeira_categoria_pai_id_fkey" FOREIGN KEY ("categoria_pai_id") REFERENCES "financeiro"."categoria_financeira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."conta_financeira" ADD CONSTRAINT "conta_financeira_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "financeiro"."conta_financeira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "financeiro"."categoria_financeira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_contato_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "financeiro"."contato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."orcamento" ADD CONSTRAINT "orcamento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."orcamento" ADD CONSTRAINT "orcamento_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "financeiro"."categoria_financeira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
