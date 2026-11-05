-- Log de auditoria do módulo financeiro: autor, organização, diff dos campos
-- alterados e origem da requisição.
-- As colunas novas NOT NULL (modulo, resumo) não têm default: a migration
-- falha se a tabela já tiver registros. Verifique antes de aplicar:
--   SELECT count(*) FROM public.auditoria;

-- AlterTable
ALTER TABLE "auditoria" ADD COLUMN     "alteracoes" JSONB,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "modulo" TEXT NOT NULL,
ADD COLUMN     "organizacao_id" INTEGER,
ADD COLUMN     "perfil" TEXT,
ADD COLUMN     "request_id" TEXT,
ADD COLUMN     "resumo" TEXT NOT NULL,
ADD COLUMN     "user_agent" TEXT,
ALTER COLUMN "usuario_id" DROP NOT NULL,
ALTER COLUMN "recurso_id" DROP NOT NULL,
ALTER COLUMN "data_hora" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "auditoria_organizacao_id_modulo_data_hora_idx" ON "auditoria"("organizacao_id", "modulo", "data_hora");

-- CreateIndex
CREATE INDEX "auditoria_recurso_tipo_recurso_id_idx" ON "auditoria"("recurso_tipo", "recurso_id");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_data_hora_idx" ON "auditoria"("usuario_id", "data_hora");

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Imutabilidade: a auditoria só recebe INSERT, inclusive para quem acessa o
-- banco direto (Prisma Studio, SQL). UPDATE e TRUNCATE são sempre recusados;
-- DELETE só vale para registros fora do prazo de retenção de 3 anos.
-- Mudar o prazo exige uma nova migration recriando esta função.
CREATE OR REPLACE FUNCTION "auditoria_somente_insercao"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.data_hora < now() - interval '3 years' THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'Registros de auditoria só podem ser apagados após 3 anos (registro %).', OLD.id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RAISE EXCEPTION 'Registros de auditoria não podem ser alterados (operação %).', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER "auditoria_imutavel"
BEFORE UPDATE OR DELETE ON "auditoria"
FOR EACH ROW EXECUTE FUNCTION "auditoria_somente_insercao"();

CREATE TRIGGER "auditoria_sem_truncate"
BEFORE TRUNCATE ON "auditoria"
FOR EACH STATEMENT EXECUTE FUNCTION "auditoria_somente_insercao"();
