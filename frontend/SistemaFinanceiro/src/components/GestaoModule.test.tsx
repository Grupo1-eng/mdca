import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { GestaoEducandosProvider } from "@/modules/gestao/educandos/EducandosContext"
import GestaoModule from "./GestaoModule"

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      nome: "Helena Martins",
      email: "helena@mdca.org.br",
      perfil: "coordenador",
    },
    logout: vi.fn(),
  }),
}))

function renderizarRota(pathname: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[pathname]}>
      <GestaoEducandosProvider>
        <Routes>
          <Route path="/gestao/*" element={<GestaoModule />} />
        </Routes>
      </GestaoEducandosProvider>
    </MemoryRouter>,
  )
}

describe("rotas migradas da Gestão", () => {
  it("mantém o Dashboard em /gestao", () => {
    const html = renderizarRota("/gestao")
    expect(html).toContain("Visão geral")
    expect(html).toContain('href="/gestao/educandos"')
    expect(html).toContain('href="/financeiro"')
    expect(html).toContain("Sair")
  })

  it("renderiza a listagem em /gestao/educandos", () => {
    const html = renderizarRota("/gestao/educandos")
    expect(html).toContain("Crianças e adolescentes vinculados")
    expect(html).toContain("Ana Beatriz Souza")
    expect(html).toContain("Novo educando")
    expect(html).toContain('href="/gestao/educandos/novo"')
    expect(html).toContain('href="/gestao/educandos/edu-1"')
  })

  it("renderiza o cadastro completo em /gestao/educandos/novo", () => {
    const html = renderizarRota("/gestao/educandos/novo")
    expect(html).toContain("Dados pessoais")
    expect(html).toContain("Responsáveis familiares")
    expect(html).toContain("Ingresso e encaminhamento")
    expect(html).toContain('href="/gestao/educandos"')
  })

  it("renderiza a ficha de um id válido", () => {
    const html = renderizarRota("/gestao/educandos/edu-1")
    expect(html).toContain("Ana Beatriz Souza")
    expect(html).toContain("Ficha cadastral")
    expect(html).toContain("Fichas de evolução")
    expect(html).toContain("Histórico de frequência")
    expect(html).toContain('href="/gestao/educandos"')
  })
})
