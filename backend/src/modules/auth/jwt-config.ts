// Sem fallback: uma chave padrão no código deixaria qualquer pessoa forjar
// tokens válidos sempre que o .env estivesse faltando.
export function obterJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET não definido. Configure a variável no .env antes de iniciar a aplicação.');
  }
  return secret;
}
