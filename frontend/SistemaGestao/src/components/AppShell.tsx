import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  BarChart3,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { usePermissoes, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, chave: "sempre" },
  { to: "/educandos", label: "Educandos", icon: Users, chave: "sempre" },
  
  { to: "/atividades", label: "Atividades e Frequência", icon: Activity, chave: "sempre" },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, chave: "sempre" },
  { to: "/projetos", label: "Projetos, Serviços e Programas", icon: FolderKanban, chave: "sempre" },
  { to: "/indicadores", label: "Painel de Indicadores", icon: BarChart3, chave: "indicadores" },
  { to: "/acessos", label: "Configurações de Acesso", icon: Settings, chave: "config" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, nomePerfil, sair } = useStore();
  const perm = usePermissoes();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const itens = NAV.filter((n) =>
    n.chave === "indicadores"
      ? perm.verIndicadores
      : n.chave === "config"
        ? perm.verConfiguracoes
        : true,
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <img src="/logo-mdca.png" alt="MDCA" className="size-10 rounded-full bg-white object-contain" />
          <div>
            <p className="text-sm font-semibold leading-tight text-sidebar-foreground">MDCA</p>
            <p className="text-xs text-sidebar-foreground/70">Módulo Gestão</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {itens.map((item) => {
            const ativo = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  ativo
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <p className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/70">
          Protótipo Sprint 1 — dados fictícios.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
          <div>
            <p className="text-sm font-semibold">Sistema de Gestão MDCA</p>
            <p className="text-xs text-muted-foreground">
              Organização: MDCA – Sede · entidades compartilhadas com o módulo Financeiro
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{usuario?.nome}</p>
              <p className="text-xs text-muted-foreground">
                {usuario ? nomePerfil(usuario.perfil) : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={sair}>
              <LogOut className="size-4" /> Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex gap-2">{acoes}</div>}
    </div>
  );
}
