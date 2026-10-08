import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as authApi from "@/api/auth";
import { EVENTO_SESSAO_EXPIRADA, getToken, setToken as persistToken } from "@/api/client";
import type { AuthUser, LoginPayload } from "@/types/financeiro";

interface AuthContextValue {
  user: AuthUser | null;
  // true enquanto o token salvo é validado no backend, ao abrir a página.
  restaurando: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restaurando, setRestaurando] = useState(() => getToken() !== null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Token com que o estado atual foi montado; comparado ao cookie para notar
  // entradas e saídas feitas pelo frontend da Gestão, que usa a mesma sessão.
  const tokenDaSessao = useRef<string | null>(getToken());

  const logout = useCallback(() => {
    persistToken(null);
    tokenDaSessao.current = null;
    setUser(null);
  }, []);

  // Revalida o token salvo em /api/auth/me: se expirou ou o usuário foi
  // inativado, o backend responde 401 e a sessão não é restaurada.
  useEffect(() => {
    if (!getToken()) return;
    let cancelado = false;
    authApi
      .me()
      .then((usuario) => { if (!cancelado) setUser(usuario); })
      .catch(() => { if (!cancelado) logout(); })
      .finally(() => { if (!cancelado) setRestaurando(false); });
    return () => { cancelado = true; };
  }, [logout]);

  // Ao voltar para esta aba, confere se a sessão mudou pela Gestão.
  useEffect(() => {
    const conferir = () => {
      const atual = getToken();
      if (atual === tokenDaSessao.current) return;
      tokenDaSessao.current = atual;
      if (!atual) {
        setUser(null);
        return;
      }
      authApi.me().then(setUser).catch(() => setUser(null));
    };
    const aoMudarVisibilidade = () => { if (document.visibilityState === "visible") conferir(); };
    window.addEventListener("focus", conferir);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      window.removeEventListener("focus", conferir);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, []);

  // Qualquer 401 durante o uso (token expirado, usuário inativado) volta ao login.
  useEffect(() => {
    const aoExpirar = () => {
      tokenDaSessao.current = null;
      setUser(null);
      setError("Sua sessão expirou. Entre novamente.");
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(payload);
      persistToken(res.accessToken);
      tokenDaSessao.current = res.accessToken;
      setUser(res.usuario);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      setLoading(false);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, restaurando, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
