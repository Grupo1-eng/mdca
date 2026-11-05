import { type ReactNode, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import NavBar, { type LogEntry, type Module } from "@/components/NavBar";
import Dashboard from "@/components/Dashboard";
import Financeiro from "@/components/Financeiro";
import Projetos from "@/components/Projetos";
import Relatorios from "@/components/Relatorios";
import Cadastros from "@/components/Cadastros";
import Usuarios from "@/components/Usuarios";
import Auditoria from "@/components/Auditoria";
import { podeVerAuditoria } from "@/lib/auditoria";
import { LoginScreen } from "@/components/AuthScreens";
import GestaoModule from "@/components/GestaoModule";
import { LoadingState } from "@/components/StatusMessage";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PeriodoProvider } from "@/context/PeriodoContext";
import {
  moduloDaNavegacao,
  moduloPermitido,
  rotaDoModulo,
  rotaPosLogin,
  type ModuloDestino,
} from "@/lib/moduloDestino";
import { GestaoAgendaProvider } from "@/modules/gestao/agenda/AgendaContext";
import { GestaoEducandosProvider } from "@/modules/gestao/educandos/EducandosContext";
import type { AuthUser } from "@/types/financeiro";

function AreaLogada({ user }: { user: AuthUser }) {
  const [module, setModule] = useState<Module>("inicio");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs(prev => [...prev, {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    }]);
  };

  // PeriodoProvider: o filtro de período é o mesmo no Início, no Financeiro e nos Relatórios.
  return <PeriodoProvider>
    <div className="min-h-screen bg-[var(--background)]">
      <NavBar active={module} setModule={setModule} logs={logs} onClearLogs={() => setLogs([])} />
      <main className="max-w-screen-xl mx-auto px-6 py-7">
        {module === "inicio" && <Dashboard />}
        {module === "financeiro" && <Financeiro addLog={addLog} />}
        {module === "projetos" && <Projetos addLog={addLog} />}
        {module === "relatorios" && <Relatorios />}
        {module === "cadastros" && <Cadastros addLog={addLog} />}
        {module === "usuarios" && user.perfil === "coordenador" && <Usuarios addLog={addLog} />}
        {module === "auditoria" && podeVerAuditoria(user.perfil) && <Auditoria />}
      </main>
    </div>
  </PeriodoProvider>;
}

function RotaInicial() {
  const { user, restaurando } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const modulo = moduloDaNavegacao(location.state);

  if (restaurando) return <LoadingState label="Verificando sessão…" />;
  if (user) return <Navigate to={rotaPosLogin(location.state, user.perfil)} replace />;

  const selecionarModulo = (proximo: ModuloDestino) => {
    navigate("/", { replace: true, state: { modulo: proximo } });
  };

  return <LoginScreen modulo={modulo} onModuloChange={selecionarModulo} />;
}

// Exige sessão e, com `modulo`, que o perfil tenha acesso a ele: quem não tem
// vai para o outro módulo (ex.: coordenador da Gestão em /financeiro).
function RotaProtegida({ children, modulo }: { children: ReactNode; modulo?: ModuloDestino }) {
  const { user, restaurando } = useAuth();

  if (restaurando) return <LoadingState label="Verificando sessão…" />;
  if (!user) return <Navigate to="/" replace />;
  if (modulo) {
    const permitido = moduloPermitido(modulo, user.perfil);
    if (permitido !== modulo) return <Navigate to={rotaDoModulo(permitido)} replace />;
  }
  return children;
}

function FinanceiroRoute() {
  const { user } = useAuth();
  if (!user) return null;
  // key: trocar de usuário recomeça a área logada (módulo aberto e log de atividades).
  return <AreaLogada key={user.id} user={user} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RotaInicial />} />
      <Route
        path="/financeiro"
        element={
          <RotaProtegida modulo="financeiro">
            <FinanceiroRoute />
          </RotaProtegida>
        }
      />
      <Route
        path="/gestao/*"
        element={
          <RotaProtegida modulo="gestao">
            <GestaoModule />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function chaveEstadoGestao(usuarioId: number | undefined): string {
  return usuarioId === undefined ? "sem-usuario" : `usuario-${usuarioId}`;
}

function EstadoGestaoDaSessao({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Os estados mock da Gestão acompanham a sessão, não a rota atualmente aberta.
  // A chave impede que dados temporários passem de um usuário para outro.
  return (
    <GestaoEducandosProvider key={chaveEstadoGestao(user?.id)}>
      <GestaoAgendaProvider>{children}</GestaoAgendaProvider>
    </GestaoEducandosProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EstadoGestaoDaSessao>
        <AppRoutes />
      </EstadoGestaoDaSessao>
    </AuthProvider>
  );
}
