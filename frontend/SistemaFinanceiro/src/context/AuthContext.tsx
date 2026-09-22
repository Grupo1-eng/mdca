import React, { createContext, useCallback, useContext, useState } from "react";
import * as authApi from "@/api/auth";
import { getToken, setToken as persistToken } from "@/api/client";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/types/financeiro";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = "mdca_user";

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null): void {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // localStorage indisponível — sessão não persiste entre recargas.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Sessão restaurada do localStorage sem revalidar o token contra o backend
  // (não há endpoint /auth/me definido ainda). Suficiente por ora; se o token
  // tiver expirado, a primeira chamada autenticada volta 401 e quem chamar
  // pode tratar isso como logout.
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? loadStoredUser() : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(payload);
      persistToken(res.token);
      persistUser(res.user);
      setUser(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(payload);
      persistToken(res.token);
      persistUser(res.user);
      setUser(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    persistUser(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
