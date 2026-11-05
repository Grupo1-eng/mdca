-- Gestão: integridade do banco. Só mexe em tabelas do schema "gestao";
-- não altera nada do Financeiro nem do schema "public".
--
-- 1) criado_em: momento real em que cada registro foi gravado (RNF05).
--    Diferente de data_inicio / data_encaminhamento / data, que podem ser
--    editadas. Registros já existentes recebem a melhor data disponível.
-- 2) Tipos mais precisos: data_nascimento vira DATE (não tem hora) e
--    renda_familiar vira DECIMAL(12,2) (valor em reais com centavos).
-- 3) Índices nas chaves estrangeiras e nas consultas mais usadas: o Postgres
--    não cria índice automático para FK.
-- 4) Um educando só pode estar vinculado uma vez a cada projeto.
--    Falha se já houver vínculos repetidos. Verifique antes de aplicar:
--      SELECT educando_id, projeto_id, count(*) FROM gestao.educando_projeto
--      GROUP BY 1, 2 HAVING count(*) > 1;
-- 5) Regras CHECK (textos obrigatórios não vazios, datas de fim depois das
--    de início, valores não negativos). Criadas como NOT VALID: valem para
--    todo INSERT/UPDATE daqui em diante, mas não bloqueiam a migration por
--    causa de dados antigos. Para conferir os dados antigos depois, rode
--    ALTER TABLE ... VALIDATE CONSTRAINT <nome>; para cada uma.
--    O Prisma não representa CHECK no schema.prisma: elas vivem só aqui.

-- ==========================================================
-- 1) criado_em
-- ==========================================================

-- AlterTable
ALTER TABLE "gestao"."educando" ADD COLUMN     "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "data_nascimento" SET DATA TYPE DATE,
ALTER COLUMN "renda_familiar" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "gestao"."responsavel_familiar" ADD COLUMN     "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "gestao"."evolucao" ADD COLUMN     "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "gestao"."encaminhamento" ADD COLUMN     "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "gestao"."acompanhamento_encaminhamento" ADD COLUMN     "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "gestao"."compromisso" ADD COLUMN     "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Registros anteriores a esta migration: usa a data do próprio registro.
-- Educando, responsável e compromisso não têm uma data equivalente e ficam
-- com a data de aplicação desta migration.
UPDATE "gestao"."evolucao" SET "criado_em" = "data_inicio";
UPDATE "gestao"."encaminhamento" SET "criado_em" = "data_encaminhamento";
UPDATE "gestao"."acompanhamento_encaminhamento" SET "criado_em" = "data";

-- ==========================================================
-- 3) e 4) Índices
-- ==========================================================

-- CreateIndex
CREATE INDEX "educando_organizacao_id_nome_idx" ON "gestao"."educando"("organizacao_id", "nome");

-- CreateIndex
CREATE INDEX "educando_tecnico_responsavel_id_idx" ON "gestao"."educando"("tecnico_responsavel_id");

-- CreateIndex
CREATE INDEX "responsavel_familiar_educando_id_idx" ON "gestao"."responsavel_familiar"("educando_id");

-- CreateIndex
CREATE INDEX "educando_projeto_projeto_id_idx" ON "gestao"."educando_projeto"("projeto_id");

-- CreateIndex
CREATE UNIQUE INDEX "educando_projeto_educando_id_projeto_id_key" ON "gestao"."educando_projeto"("educando_id", "projeto_id");

-- CreateIndex
CREATE INDEX "atividade_projeto_id_idx" ON "gestao"."atividade"("projeto_id");

-- CreateIndex
CREATE INDEX "atividade_responsavel_id_idx" ON "gestao"."atividade"("responsavel_id");

-- CreateIndex
CREATE INDEX "encontro_atividade_id_data_inicio_idx" ON "gestao"."encontro"("atividade_id", "data_inicio");

-- CreateIndex
CREATE INDEX "frequencia_educando_id_idx" ON "gestao"."frequencia"("educando_id");

-- CreateIndex
CREATE INDEX "evolucao_educando_id_data_inicio_idx" ON "gestao"."evolucao"("educando_id", "data_inicio");

-- CreateIndex
CREATE INDEX "evolucao_profissional_id_idx" ON "gestao"."evolucao"("profissional_id");

-- CreateIndex
CREATE INDEX "evolucao_projeto_id_idx" ON "gestao"."evolucao"("projeto_id");

-- CreateIndex
CREATE INDEX "encaminhamento_educando_id_data_encaminhamento_idx" ON "gestao"."encaminhamento"("educando_id", "data_encaminhamento");

-- CreateIndex
CREATE INDEX "encaminhamento_evolucao_id_idx" ON "gestao"."encaminhamento"("evolucao_id");

-- CreateIndex
CREATE INDEX "encaminhamento_profissional_id_idx" ON "gestao"."encaminhamento"("profissional_id");

-- CreateIndex
CREATE INDEX "acompanhamento_encaminhamento_encaminhamento_id_data_idx" ON "gestao"."acompanhamento_encaminhamento"("encaminhamento_id", "data");

-- CreateIndex
CREATE INDEX "compromisso_data_inicio_idx" ON "gestao"."compromisso"("data_inicio");

-- CreateIndex
CREATE INDEX "compromisso_criador_id_idx" ON "gestao"."compromisso"("criador_id");

-- ==========================================================
-- 5) Regras CHECK
-- ==========================================================

-- Educando
ALTER TABLE "gestao"."educando"
  ADD CONSTRAINT "educando_nome_preenchido_chk" CHECK (btrim("nome") <> '') NOT VALID,
  ADD CONSTRAINT "educando_situacao_preenchida_chk" CHECK (btrim("situacao_atual") <> '') NOT VALID,
  ADD CONSTRAINT "educando_pessoas_familia_positivo_chk" CHECK ("numeros_pessoas_familias" IS NULL OR "numeros_pessoas_familias" > 0) NOT VALID,
  ADD CONSTRAINT "educando_renda_nao_negativa_chk" CHECK ("renda_familiar" IS NULL OR "renda_familiar" >= 0) NOT VALID;

-- Responsável familiar
ALTER TABLE "gestao"."responsavel_familiar"
  ADD CONSTRAINT "responsavel_familiar_nome_preenchido_chk" CHECK (btrim("nome") <> '') NOT VALID,
  ADD CONSTRAINT "responsavel_familiar_vinculo_preenchido_chk" CHECK (btrim("vinculo") <> '') NOT VALID;

-- Evolução
ALTER TABLE "gestao"."evolucao"
  ADD CONSTRAINT "evolucao_situacao_preenchida_chk" CHECK (btrim("situacao") <> '') NOT VALID,
  ADD CONSTRAINT "evolucao_periodo_valido_chk" CHECK ("data_fim" IS NULL OR "data_fim" >= "data_inicio") NOT VALID;

-- Encaminhamento e acompanhamento
ALTER TABLE "gestao"."encaminhamento"
  ADD CONSTRAINT "encaminhamento_situacao_preenchida_chk" CHECK (btrim("situacao_atual") <> '') NOT VALID;

ALTER TABLE "gestao"."acompanhamento_encaminhamento"
  ADD CONSTRAINT "acompanhamento_encaminhamento_situacao_preenchida_chk" CHECK (btrim("situacao") <> '') NOT VALID;

-- Compromisso (agenda)
ALTER TABLE "gestao"."compromisso"
  ADD CONSTRAINT "compromisso_titulo_preenchido_chk" CHECK (btrim("titulo") <> '') NOT VALID,
  ADD CONSTRAINT "compromisso_situacao_preenchida_chk" CHECK (btrim("situacao") <> '') NOT VALID,
  ADD CONSTRAINT "compromisso_periodo_valido_chk" CHECK ("data_fim" IS NULL OR "data_fim" >= "data_inicio") NOT VALID;

-- Atividade, encontro e frequência
ALTER TABLE "gestao"."atividade"
  ADD CONSTRAINT "atividade_nome_preenchido_chk" CHECK (btrim("nome") <> '') NOT VALID;

ALTER TABLE "gestao"."encontro"
  ADD CONSTRAINT "encontro_periodo_valido_chk" CHECK ("data_fim" IS NULL OR "data_inicio" IS NULL OR "data_fim" >= "data_inicio") NOT VALID;

ALTER TABLE "gestao"."frequencia"
  ADD CONSTRAINT "frequencia_presenca_preenchida_chk" CHECK (btrim("presenca_ausencia") <> '') NOT VALID;
