// Client HTTP único usado por todos os serviços em src/api/. Centraliza a URL
// base do backend, o header de autenticação e a normalização de erros, para
// que os componentes nunca chamem fetch() diretamente.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";
const TOKEN_KEY = "mdca_token";

/** Disparado em `window` quando o backend recusa o token (expirado ou usuário inativado). */
export const EVENTO_SESSAO_EXPIRADA = "mdca:sessao-expirada";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados etc.) — sessão não persiste.
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorMessage(res: Response): Promise<string> {
  // Rate limit do login: a mensagem padrão do backend é técnica e em inglês.
  if (res.status === 429) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  const body = await res.json().catch(() => null);
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return `Erro ${res.status} ao acessar ${res.url}`;
}

export interface RequestOptions extends RequestInit {
  // No login, 401 significa senha errada, não sessão expirada.
  publica?: boolean;
}

async function tratarResposta<T>(res: Response, publica: boolean): Promise<T> {
  if (!res.ok) {
    const mensagem = await parseErrorMessage(res);
    if (res.status === 401 && !publica) {
      setToken(null);
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new ApiError(mensagem, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function request<T>(path: string, { publica = false, ...options }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  return tratarResposta<T>(res, publica);
}

/** Envio de arquivo (multipart/form-data) — usado pelos anexos de lançamento. */
export async function requestForm<T>(path: string, form: FormData, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    method: options.method ?? "POST",
    headers: { ...authHeaders(), ...(options.headers as Record<string, string> | undefined) },
    body: form,
  });
  return tratarResposta<T>(res, false);
}
