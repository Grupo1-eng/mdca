import { request } from "./client";
import type { AuthResponse, AuthUser, LoginPayload } from "@/types/financeiro";

// Não há cadastro público: usuários são criados pela coordenação em POST /api/usuarios.
export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    publica: true,
  });
}

export function me(): Promise<AuthUser> {
  return request<AuthUser>("/api/auth/me");
}
