-- Um e-mail identifica um único usuário no login.
-- Falha se já existirem e-mails repetidos (inclusive só com maiúsculas
-- diferentes) — verifique antes de aplicar:
--   SELECT lower(email), count(*) FROM public.usuario GROUP BY 1 HAVING count(*) > 1;
UPDATE "public"."usuario" SET "email" = lower(trim("email"));

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "public"."usuario"("email");
