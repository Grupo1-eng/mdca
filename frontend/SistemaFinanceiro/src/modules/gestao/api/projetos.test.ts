import { beforeEach, describe, expect, it, vi } from "vitest"

const request = vi.fn()
vi.mock("@/api/client", () => ({ request: (...args: unknown[]) => request(...args) }))

import { atualizarProjeto, criarProjeto, listarProjetos } from "./projetos"

const payload = {
  nome: "Semear",
  descricao: null,
  tipo: "PROJETO" as const,
  status: "Planejamento",
  orcamentoTotal: null,
  dataInicio: null,
  dataFim: null,
}

// O cadastro de iniciativas é da Gestão: nada passa por /api/projetos.
describe("rotas de iniciativas", () => {
  beforeEach(() => request.mockReset().mockResolvedValue([]))

  it("lista, cria e edita pelas rotas da Gestão", async () => {
    await listarProjetos()
    await criarProjeto(payload)
    await atualizarProjeto(7, payload)
    expect(request.mock.calls.map(([url, opcoes]) => [url, opcoes?.method])).toEqual([
      ["/api/iniciativas", undefined],
      ["/api/iniciativas", "POST"],
      ["/api/iniciativas/7", "PUT"],
    ])
  })
})
