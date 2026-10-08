import { Link } from "react-router-dom"
import mdcaLogo from "@/imports/coisaaa.png"
import { useAuth } from "@/context/AuthContext"
import GestaoDashboard from "@/components/GestaoDashboard"
import type { Perfil } from "@/types/financeiro"

const menu = [
  "Dashboard",
  "Educandos",
  "Atividades e Frequência",
  "Agenda",
  "Projetos, Serviços e Programas",
] as const

const perfilLabel: Record<Perfil, string> = {
  coordenador: "Coordenação",
  tecnico_servico_social: "Técnico – Serviço Social",
  tecnico_psicologia: "Técnico – Psicologia",
  educador: "Educador",
  administrativo: "Administrativo",
}

function iniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export default function GestaoModule() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[#0f1e3d] text-white sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="min-h-14 flex flex-wrap items-center gap-4 py-2">
            <div className="flex items-center gap-2 mr-auto">
              <img
                src={mdcaLogo}
                alt="MDCA"
                className="w-8 h-8 rounded-full object-contain bg-white"
              />
              <span className="font-serif text-lg leading-none tracking-tight">
                Gestão MDCA
              </span>
              <span className="text-xs text-[#0e7e6e] font-mono uppercase tracking-widest ml-1">
                Sistema
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-white/90">
                  {user?.nome}
                </p>
                <p className="text-[10px] text-white/40">
                  {user ? perfilLabel[user.perfil] : ""}
                </p>
              </div>
              <div
                className="w-7 h-7 rounded-full bg-[#0e7e6e]/30 flex items-center justify-center text-xs font-semibold text-[#48c5af]"
                title={user?.nome}
              >
                {user ? iniciais(user.nome) : "?"}
              </div>
              <Link
                to="/financeiro"
                className="text-xs text-white/60 hover:text-white hover:bg-white/5 rounded px-2 py-1 transition-colors"
              >
                Ir para Financeiro
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-xs text-white/60 hover:text-white hover:bg-white/5 rounded px-2 py-1 transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>

          <nav
            className="flex items-center gap-1 overflow-x-auto pb-2"
            aria-label="Navegação da Gestão"
          >
            {menu.map((item, index) =>
              index === 0 ? (
                <Link
                  key={item}
                  to="/gestao"
                  className="shrink-0 px-4 py-1.5 rounded text-sm font-medium bg-white/10 text-white"
                >
                  {item}
                </Link>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled
                  title="Disponível em uma próxima etapa da migração"
                  className="shrink-0 px-4 py-1.5 rounded text-sm font-medium text-white/45 cursor-not-allowed"
                >
                  {item}
                </button>
              ),
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-7">
        <GestaoDashboard />
      </main>
    </div>
  )
}
