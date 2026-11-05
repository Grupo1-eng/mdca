import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import App, { chaveEstadoGestao } from "./App"

// "administrativo" acessa os dois módulos; os testes de acesso trocam o perfil.
const sessao = vi.hoisted(() => ({ perfil: "administrativo" }))

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: {
      id: 1,
      nome: "Helena Martins",
      email: "helena@mdca.org.br",
      perfil: sessao.perfil,
    },
    restaurando: false,
  }),
}))

vi.mock("@/modules/gestao/educandos/EducandosContext", () => ({
  GestaoEducandosProvider: ({ children }: { children: ReactNode }) => (
    <div data-estado-educandos="montado">{children}</div>
  ),
}))

vi.mock("@/modules/gestao/agenda/AgendaContext", () => ({
  GestaoAgendaProvider: ({ children }: { children: ReactNode }) => (
    <div data-estado-agenda="montado">{children}</div>
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

describe("tempo de vida dos estados temporários da Gestão", () => {
  it("mantém os providers acima das rotas Financeiro e Gestão", () => {
    const financeiro = renderizar("/financeiro")
    const gestao = renderizar("/gestao")

    expect(financeiro).toContain('data-estado-educandos="montado"')
    expect(financeiro).toContain('data-estado-agenda="montado"')
    expect(financeiro).toContain("Financeiro ativo")
    expect(gestao).toContain('data-estado-educandos="montado"')
    expect(gestao).toContain('data-estado-agenda="montado"')
    expect(gestao).toContain("Gestão ativa")
  })

  it("leva cada perfil só ao módulo que ele acessa", () => {
    sessao.perfil = "coordenador"
    expect(renderizar("/financeiro")).not.toContain("Financeiro ativo")
    expect(renderizar("/gestao")).toContain("Gestão ativa")

    sessao.perfil = "gestor_financeiro"
    expect(renderizar("/gestao")).not.toContain("Gestão ativa")
    expect(renderizar("/financeiro")).toContain("Financeiro ativo")

    sessao.perfil = "administrativo"
  })

  it("troca a chave dos estados no logout ou na troca de usuário", () => {
    expect(chaveEstadoGestao(1)).toBe(chaveEstadoGestao(1))
    expect(chaveEstadoGestao(1)).not.toBe(chaveEstadoGestao(2))
    expect(chaveEstadoGestao(1)).not.toBe(chaveEstadoGestao(undefined))
  })
})
