-- Gestão: autorização de uso de imagem e voz do educando, assinada pelos
-- responsáveis familiares (questionário da MDCA, pergunta 24).
-- Só adiciona duas colunas opcionais em "gestao"."educando"; não altera
-- dados existentes nem nada do Financeiro. NULL = não informado.

-- AlterTable
ALTER TABLE "gestao"."educando" ADD COLUMN     "autorizacao_imagem" BOOLEAN,
ADD COLUMN     "autorizacao_imagem_data" DATE;
