// Endereços dos dois frontends do MDCA, que compartilham a mesma sessão
// (ver o cookie em src/api/client.ts).
export const URL_FINANCEIRO = (import.meta.env.VITE_FINANCEIRO_URL as string | undefined) ?? "http://localhost:8443";
export const URL_GESTAO = (import.meta.env.VITE_GESTAO_URL as string | undefined) ?? "http://localhost:8080";
