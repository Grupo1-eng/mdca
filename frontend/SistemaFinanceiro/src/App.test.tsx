import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import App from "./App"

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: {
      id: 1,
      nome: "Helena Martins",
      email: "helena@mdca.org.br",
      perfil: "coordenador",
    },
    restaurando: false,
  }),
}))

vi.mock("@/modules/gestao/educandos/EducandosContext", () => ({
  GestaoEducandosProvider: ({ children }: { children: ReactNode }) => (
    <div data-estado-educandos="montado">{children}</div>
  ),
}))

vi.mock("@/components/NavBar", () => ({
  default: () => <div>Financeiro ativo</div>,
}))
vi.mock("@/components/Dashboard", () => ({ default: () => null }))
vi.mock("@/components/Financeiro", () => ({ default: () => null }))
vi.mock("@/components/Projetos", () => ({ default: () => null }))
vi.mock("@/components/Relatorios", () => ({ default: () => null }))
vi.mock("@/components/Cadastros", () => ({ default: () => null }))
vi.mock("@/components/Usuarios", () => ({ default: () => null }))
vi.mock("@/components/GestaoModule", () => ({
  default: () => <div>Gestão ativa</div>,
}))

function renderizar(pathname: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[pathname]}>
      <App />
    </MemoryRouter>,
  )
}

describe("tempo de vida do estado de Educandos", () => {
  it("mantém o provider acima das rotas Financeiro e Gestão", () => {
    const financeiro = renderizar("/financeiro")
    const gestao = renderizar("/gestao")

    expect(financeiro).toContain('data-estado-educandos="montado"')
    expect(financeiro).toContain("Financeiro ativo")
    expect(gestao).toContain('data-estado-educandos="montado"')
    expect(gestao).toContain("Gestão ativa")
  })
})
