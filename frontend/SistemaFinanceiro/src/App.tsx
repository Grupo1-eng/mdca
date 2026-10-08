import { type ReactNode, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import NavBar, { type LogEntry, type Module } from "@/components/NavBar";
import Dashboard from "@/components/Dashboard";
import Financeiro from "@/components/Financeiro";
import Projetos from "@/components/Projetos";
import Relatorios from "@/components/Relatorios";
import Cadastros from "@/components/Cadastros";
import Usuarios from "@/components/Usuarios";
import { LoginScreen } from "@/components/AuthScreens";
import GestaoModule from "@/components/GestaoModule";
import { LoadingState } from "@/components/StatusMessage";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { moduloDaNavegacao, rotaPosLogin, type ModuloDestino } from "@/lib/moduloDestino";
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

  return <div className="min-h-screen bg-[var(--background)]">
    <NavBar active={module} setModule={setModule} logs={logs} onClearLogs={() => setLogs([])} />
    <main className="max-w-screen-xl mx-auto px-6 py-7">
      {module === "inicio" && <Dashboard />}
      {module === "financeiro" && <Financeiro addLog={addLog} />}
      {module === "projetos" && <Projetos addLog={addLog} />}
      {module === "relatorios" && <Relatorios />}
      {module === "cadastros" && <Cadastros addLog={addLog} />}
      {module === "usuarios" && user.perfil === "coordenador" && <Usuarios addLog={addLog} />}
    </main>
  </div>;
}

function RotaInicial() {
  const { user, restaurando } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const modulo = moduloDaNavegacao(location.state);

  if (restaurando) return <LoadingState label="Verificando sessão…" />;
  if (user) return <Navigate to={rotaPosLogin(location.state)} replace />;

  const selecionarModulo = (proximo: ModuloDestino) => {
    navigate("/", { replace: true, state: { modulo: proximo } });
  };

  return <LoginScreen modulo={modulo} onModuloChange={selecionarModulo} />;
}

function RotaProtegida({ children }: { children: ReactNode }) {
  const { user, restaurando } = useAuth();

  if (restaurando) return <LoadingState label="Verificando sessão…" />;
  return user ? children : <Navigate to="/" replace />;
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
          <RotaProtegida>
            <FinanceiroRoute />
          </RotaProtegida>
        }
      />
      <Route
        path="/gestao/*"
        element={
          <RotaProtegida>
            <GestaoModule />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function EstadoEducandosDaSessao({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // O estado mock acompanha a sessão autenticada, não a rota atualmente aberta.
  // A chave também impede que dados temporários passem de um usuário para outro.
  return (
    <GestaoEducandosProvider key={user?.id ?? "sem-usuario"}>
      {children}
    </GestaoEducandosProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EstadoEducandosDaSessao>
        <AppRoutes />
      </EstadoEducandosDaSessao>
    </AuthProvider>
  );
}
