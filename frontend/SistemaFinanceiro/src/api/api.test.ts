import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTO_SESSAO_EXPIRADA, getToken, request, setToken } from "./client";
import { createLancamento, getLancamentos, updateLancamento } from "./lancamentos";
import { login, me } from "./auth";
import { getCategorias } from "./categorias";
import { getContas } from "./contas";
import { getContatos } from "./contatos";
import { getFontes } from "./fontes";
import { getOrcamentos } from "./orcamentos";
import { getProjetos } from "./projetos";
import { createUsuario, inativarUsuario, updateUsuario } from "./usuarios";

function resposta(status: number, corpo?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "http://localhost:3000/x",
    json: async () => corpo,
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  const armazenado = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => armazenado.get(k) ?? null,
    setItem: (k: string, v: string) => armazenado.set(k, v),
    removeItem: (k: string) => armazenado.delete(k),
  });
  vi.stubGlobal("window", new EventTarget());
  fetchMock = vi.fn().mockResolvedValue(resposta(200, []));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function chamada(i = 0) {
  const [url, init] = fetchMock.mock.calls[i];
  return { url: url as string, init: init as RequestInit & { headers: Record<string, string> } };
}

describe("client", () => {
  it("envia o token salvo como Bearer", async () => {
    setToken("abc");
    await request("/api/contatos");
    expect(chamada().init.headers.Authorization).toBe("Bearer abc");
  });

  it("em 401 de uma rota autenticada, apaga o token e avisa que a sessão expirou", async () => {
    setToken("expirado");
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    fetchMock.mockResolvedValue(resposta(401, { message: "Token ausente ou inválido." }));

    await expect(request("/api/lancamentos")).rejects.toThrow("Token ausente ou inválido.");

    expect(getToken()).toBeNull();
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it("traduz o bloqueio por excesso de tentativas (429)", async () => {
    fetchMock.mockResolvedValue(resposta(429, { statusCode: 429, message: "ThrottlerException: Too Many Requests" }));
    await expect(login({ email: "a@b.c", senha: "x" })).rejects.toThrow("Muitas tentativas. Aguarde um minuto e tente de novo.");
  });

  it("mostra a primeira mensagem de validação do backend", async () => {
    fetchMock.mockResolvedValue(resposta(400, { message: ["valor deve ser um valor positivo", "tipo inválido"] }));
    await expect(request("/api/lancamentos")).rejects.toThrow("valor deve ser um valor positivo, tipo inválido");
  });
});

describe("auth", () => {
  it("faz login em /api/auth/login e guarda o accessToken", async () => {
    const usuario = { id: 7, nome: "Maria", email: "maria@mdca.org.br", perfil: "administrativo" };
    fetchMock.mockResolvedValue(resposta(200, { accessToken: "jwt", usuario }));

    const res = await login({ email: "maria@mdca.org.br", senha: "x" });

    expect(chamada().url).toBe("http://localhost:3000/api/auth/login");
    expect(chamada().init.method).toBe("POST");
    expect(res.usuario).toEqual(usuario);
  });

  it("senha errada no login não é tratada como sessão expirada", async () => {
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    fetchMock.mockResolvedValue(resposta(401, { message: "E-mail ou senha inválidos." }));

    await expect(login({ email: "a@b.c", senha: "x" })).rejects.toThrow("E-mail ou senha inválidos.");
    expect(ouvinte).not.toHaveBeenCalled();
  });

  it("consulta o usuário do token em /api/auth/me", async () => {
    await me();
    expect(chamada().url).toBe("http://localhost:3000/api/auth/me");
  });
});

describe("usuarios", () => {
  it("cria em POST /api/usuarios com senha, sem organização", async () => {
    fetchMock.mockResolvedValue(resposta(201, { id: 1 }));
    await createUsuario({ nome: "Maria", email: "maria@mdca.org.br", senha: "senha-segura", perfil: "educador" });
    expect(chamada().url).toBe("http://localhost:3000/api/usuarios");
    expect(chamada().init.method).toBe("POST");
    expect(JSON.parse(chamada().init.body as string)).not.toHaveProperty("organizacaoId");
  });

  it("inativa em PATCH /api/usuarios/:id/inativar", async () => {
    fetchMock.mockResolvedValue(resposta(200, { id: 3, ativo: false }));
    await inativarUsuario(3);
    expect(chamada().url).toBe("http://localhost:3000/api/usuarios/3/inativar");
    expect(chamada().init.method).toBe("PATCH");
  });

  it("reativa com PUT { ativo: true }", async () => {
    fetchMock.mockResolvedValue(resposta(200, { id: 3, ativo: true }));
    await updateUsuario(3, { ativo: true });
    expect(chamada().init.method).toBe("PUT");
    expect(JSON.parse(chamada().init.body as string)).toEqual({ ativo: true });
  });
});

describe("recursos", () => {
  it.each([
    [getLancamentos, "/api/lancamentos"],
    [getContas, "/api/contas-financeiras"],
    [getCategorias, "/api/categorias-financeiras"],
    [getContatos, "/api/contatos"],
    [getFontes, "/api/fontes-de-recurso"],
    [getProjetos, "/api/projetos"],
    [getOrcamentos, "/api/orcamentos"],
  ])("lista em %s", async (listar, rota) => {
    await (listar as () => Promise<unknown>)();
    expect(chamada().url).toBe(`http://localhost:3000${rota}`);
  });

  it("converte o Decimal da resposta em número", async () => {
    fetchMock.mockResolvedValue(resposta(200, [{ id: 1, valor: "10.50" }]));
    const [l] = await getLancamentos();
    expect(l.valor).toBe(10.5);
  });

  it("cria com POST enviando o valor como texto", async () => {
    fetchMock.mockResolvedValue(resposta(201, { id: 1, valor: "10.50" }));
    await createLancamento({ contaId: 1, categoriaId: 2, valor: "10.50", tipo: "saida" });
    expect(chamada().init.method).toBe("POST");
    expect(JSON.parse(chamada().init.body as string).valor).toBe("10.50");
  });

  it("atualiza com PUT em /api/lancamentos/:id", async () => {
    fetchMock.mockResolvedValue(resposta(200, { id: 5, valor: "1" }));
    await updateLancamento(5, { situacao: "pago" });
    expect(chamada().url).toBe("http://localhost:3000/api/lancamentos/5");
    expect(chamada().init.method).toBe("PUT");
  });
});
