import { beforeEach, describe, expect, it, vi } from "vitest"

const request = vi.fn()
vi.mock("@/api/client", () => ({ request: (...args: unknown[]) => request(...args) }))

import {
  atualizarUsuario,
  criarUsuario,
  inativarUsuario,
  listarUsuarios,
  reativarUsuario,
} from "./usuarios"

describe("rotas de usuários", () => {
  beforeEach(() => request.mockReset().mockResolvedValue({}))

  it("usa a rota compartilhada /api/usuarios", async () => {
    await listarUsuarios()
    await criarUsuario({ nome: "Ana", email: "ana@x.org", senha: "senha-123", perfil: "educador" })
    await atualizarUsuario(4, { nome: "Ana Maria" })
    await inativarUsuario(4)
    expect(request.mock.calls.map(([url, opcoes]) => [url, opcoes?.method])).toEqual([
      ["/api/usuarios", undefined],
      ["/api/usuarios", "POST"],
      ["/api/usuarios/4", "PUT"],
      ["/api/usuarios/4/inativar", "PATCH"],
    ])
  })

  it("reativa com uma edição de ativo: true", async () => {
    await reativarUsuario(9)
    expect(request).toHaveBeenCalledWith("/api/usuarios/9", {
      method: "PUT",
      body: JSON.stringify({ ativo: true }),
    })
  })
})
