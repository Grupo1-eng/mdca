-- Gestão / Sprint 3: campos previstos no documento da Sprint 1 (Anexo A)
-- que ainda não existiam no banco. Só adiciona colunas opcionais e um
-- índice único em tabelas do schema "gestao"; não altera nada do Financeiro.
-- Roda depois de 20261103120000_add_descricao_encaminhamento (PR #15):
-- o motivo do encaminhamento fica na coluna `descricao` criada por ela.
-- O índice único em frequencia(encontro_id, educando_id) implementa a RN06
-- (a tabela está vazia, então não há duplicatas que impeçam a criação).

-- AlterTable
ALTER TABLE "gestao"."educando" ADD COLUMN     "genero" TEXT,
ADD COLUMN     "motivos_ingresso" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "origem_encaminhamento" TEXT,
ADD COLUMN     "serie" TEXT;

-- AlterTable
ALTER TABLE "gestao"."encontro" ADD COLUMN     "observacoes" TEXT;

-- AlterTable
ALTER TABLE "gestao"."evolucao" ADD COLUMN     "intervencao_familia" TEXT,
ADD COLUMN     "intervencao_usuario" TEXT,
ADD COLUMN     "sigiloso" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "gestao"."encaminhamento" ADD COLUMN     "destino" TEXT,
ADD COLUMN     "profissional_id" INTEGER;

-- AlterTable
ALTER TABLE "gestao"."compromisso" ADD COLUMN     "local" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "frequencia_encontro_id_educando_id_key" ON "gestao"."frequencia"("encontro_id", "educando_id");

-- AddForeignKey
ALTER TABLE "gestao"."encaminhamento" ADD CONSTRAINT "encaminhamento_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

