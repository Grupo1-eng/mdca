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
    // Painel de indicadores com filtros e exportação (US05), sem números
    // de exemplo enquanto a API não responde.
    expect(html).toContain("Painel de indicadores")
    expect(html).toContain("Exportar CSV")
    expect(html).toContain("Exportar PDF")
    expect(html).toContain("Calculando indicadores")
    expect(html).not.toContain("Disponível na próxima etapa")
    // Coordenação também vê os encaminhamentos em aberto.
    expect(html).toContain("Encaminhamentos em aberto")
    expect(html).toContain('href="/gestao/agenda"')
    expect(html).toContain('href="/gestao/educandos"')
    expect(html).toContain('href="/gestao/agenda"')
    expect(html).toContain('href="/gestao/projetos"')
    // Coordenação é admin dos dois módulos: vê o atalho para o Financeiro.
    expect(html).toContain('href="/financeiro"')
    expect(html).toContain("Sair")
  })

  // Educandos vêm da API (carregados em efeito, que a renderização estática
  // não executa): a tela abre no estado de carregamento.
  it("renderiza a listagem em /gestao/educandos", () => {
    const html = renderizarRota("/gestao/educandos")
    expect(html).toContain("Crianças e adolescentes vinculados")
    expect(html).toContain("Carregando educandos")
    // Iniciativas vêm de /api/iniciativas: o filtro e a coluna voltaram.
    expect(html).toContain("Filtrar por iniciativa")
    expect(html).toContain("Novo educando")
    expect(html).toContain('href="/gestao/educandos/novo"')
  })

  it("renderiza o cadastro completo em /gestao/educandos/novo", () => {
    const html = renderizarRota("/gestao/educandos/novo")
    expect(html).toContain("Dados pessoais")
    expect(html).toContain("Responsáveis familiares")
    expect(html).toContain("Ingresso, vulnerabilidades e encaminhamento")
    // Questionário da MDCA, pergunta 19: situações constatadas no mesmo campo.
    expect(html).toContain("Outras situações de vulnerabilidade constatadas")
    expect(html).toContain("Uso de substâncias psicoativas na família")
    expect(html).toContain("Questões de saúde mental")
    expect(html).toContain("Neurodivergência (TEA, TDAH e outras)")
    expect(html).toContain('href="/gestao/educandos"')
  })

  it("abre a ficha em estado de carregamento", () => {
    const html = renderizarRota("/gestao/educandos/12")
    expect(html).toContain("Carregando ficha")
  })

  // Atividades vêm da API (/api/atividades): sem aviso de demonstração nem
  // dados de exemplo; a tela abre carregando.
  it("renderiza a listagem de atividades em /gestao/atividades", () => {
    const html = renderizarRota("/gestao/atividades")
    expect(html).toContain("Atividades e Frequência")
    expect(html).toContain("Carregando atividades")
    expect(html).not.toContain("ainda não são salvas no servidor")
    expect(html).not.toContain("Oficina de Música")
    expect(html).toContain('href="/gestao/atividades"')
    // Coordenação pode registrar atividades.
    expect(html).toContain("Nova atividade")
  })

  it("abre o detalhe da atividade em carregamento", () => {
    expect(renderizarRota("/gestao/atividades/3")).toContain("Carregando atividade")
  })

  it("abre a lista de iniciativas em carregamento", () => {
    const html = renderizarRota("/gestao/projetos")
    expect(html).toContain("Projetos, serviços e programas")
    expect(html).toContain("Carregando iniciativas")
    expect(html).toContain("Nova iniciativa")
    expect(html).toContain('href="/gestao/projetos"')
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

  it("mostra Usuários no menu da coordenação e abre a lista em carregamento", () => {
    expect(renderizarRota("/gestao")).toContain('href="/gestao/usuarios"')
    const html = renderizarRota("/gestao/usuarios")
    expect(html).toContain("Carregando usuários")
    expect(html).toContain("Novo usuário")
  })
})
