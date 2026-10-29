import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { GestaoAgendaProvider } from "@/modules/gestao/agenda/AgendaContext"
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
        <GestaoAgendaProvider>
          <Routes>
            <Route path="/gestao/*" element={<GestaoModule />} />
          </Routes>
        </GestaoAgendaProvider>
      </GestaoEducandosProvider>
    </MemoryRouter>,
  )
}

describe("rotas migradas da Gestão", () => {
  it("mantém o Dashboard em /gestao", () => {
    const html = renderizarRota("/gestao")
    expect(html).toContain("Visão geral")
    expect(html).toContain('href="/gestao/educandos"')
    expect(html).toContain('href="/gestao/agenda"')
    // Coordenador da Gestão não tem acesso ao Financeiro: sem o atalho.
    expect(html).not.toContain('href="/financeiro"')
    expect(html).toContain("Sair")
  })

  // Educandos vêm da API (carregados em efeito, que a renderização estática
  // não executa): a tela abre no estado de carregamento.
  it("renderiza a listagem em /gestao/educandos", () => {
    const html = renderizarRota("/gestao/educandos")
    expect(html).toContain("Crianças e adolescentes vinculados")
    expect(html).toContain("Carregando educandos")
    expect(html).toContain("Novo educando")
    expect(html).toContain('href="/gestao/educandos/novo"')
  })

  it("renderiza o cadastro completo em /gestao/educandos/novo", () => {
    const html = renderizarRota("/gestao/educandos/novo")
    expect(html).toContain("Dados pessoais")
    expect(html).toContain("Responsáveis familiares")
    expect(html).toContain("Ingresso e encaminhamento")
    expect(html).toContain('href="/gestao/educandos"')
  })

  it("abre a ficha em estado de carregamento", () => {
    const html = renderizarRota("/gestao/educandos/12")
    expect(html).toContain("Carregando ficha")
  })

  it("renderiza a listagem de atividades em /gestao/atividades", () => {
    const html = renderizarRota("/gestao/atividades")
    expect(html).toContain("Atividades e Frequência")
    expect(html).toContain("Oficina de Música")
    expect(html).toContain("Educador Marcos Reis")
    expect(html).toContain("Convivência e Fortalecimento de Vínculos")
    expect(html).toContain('href="/gestao/atividades"')
    // Coordenação pode registrar atividades.
    expect(html).toContain("Nova atividade")
    expect(html).toContain("Editar")
  })

  it("renderiza a Agenda em /gestao/agenda", () => {
    const html = renderizarRota("/gestao/agenda")
    expect(html).toContain("Compromissos da equipe")
    expect(html).toContain("Novo compromisso")
    // Compromissos vêm da API: a lista abre em carregamento.
    expect(html).toContain("Carregando agenda")
    expect(html).toContain("Dia")
    expect(html).toContain("Semana")
    expect(html).toContain("Mês")
    expect(html).toContain('href="/gestao"')
    expect(html).toContain('href="/gestao/educandos"')
  })
})
