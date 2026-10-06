import { useState } from "react";
import NavBar, { type LogEntry, type Module } from "@/components/NavBar";
import Dashboard from "@/components/Dashboard";
import Financeiro from "@/components/Financeiro";
import Projetos from "@/components/Projetos";
import Relatorios from "@/components/Relatorios";
import Cadastros from "@/components/Cadastros";
import Usuarios from "@/components/Usuarios";
import { LoginScreen } from "@/components/AuthScreens";
import { LoadingState } from "@/components/StatusMessage";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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

function AppShell() {
  const { user, restaurando } = useAuth();

  if (restaurando) return <LoadingState label="Verificando sessão…" />;
  if (!user) return <LoginScreen />;
  // key: trocar de usuário recomeça a área logada (módulo aberto e log de atividades).
  return <AreaLogada key={user.id} user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
