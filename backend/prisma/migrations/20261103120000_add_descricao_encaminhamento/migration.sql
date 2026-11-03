-- Conteúdo/descrição do encaminhamento realizado (US02).
-- Coluna opcional: os encaminhamentos já existentes ficam com NULL.
-- AlterTable
ALTER TABLE "gestao"."encaminhamento" ADD COLUMN     "descricao" TEXT;
