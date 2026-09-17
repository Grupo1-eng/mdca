import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { PERFIS, type PerfilId } from "@/lib/mock-data";
import { usePermissoes, useStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const { perfil, setPerfil } = useStore();
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
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-sidebar-foreground">MDCA</p>
            <p className="text-xs text-muted-foreground">Módulo Gestão</p>
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
        <p className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
          Protótipo Sprint 1 — dados fictícios, sem autenticação real.
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Perfil de acesso (simulado)</span>
            <Select value={perfil} onValueChange={(v) => setPerfil(v as PerfilId)}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERFIS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
