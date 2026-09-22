import { useState } from "react";
import NavBar, { type LogEntry, type Module } from "@/components/NavBar";
import Dashboard from "@/components/Dashboard";
import Financeiro from "@/components/Financeiro";
import Projetos from "@/components/Projetos";
import Relatorios from "@/components/Relatorios";
import Cadastros from "@/components/Cadastros";
import { LoginScreen, CadastroScreen } from "@/components/AuthScreens";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function AppShell() {
  const { user } = useAuth();
  const [authView, setAuthView] = useState<"login" | "cadastro">("login");
  const [module, setModule] = useState<Module>("inicio");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs(prev => [...prev, {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    }]);
  };

  if (!user) {
    return authView === "login"
      ? <LoginScreen goToCadastro={() => setAuthView("cadastro")} />
      : <CadastroScreen goToLogin={() => setAuthView("login")} />;
  }

  return <div className="min-h-screen bg-[var(--background)]">
    <NavBar active={module} setModule={setModule} logs={logs} onClearLogs={() => setLogs([])} />
    <main className="max-w-screen-xl mx-auto px-6 py-7">
      {module === "inicio" && <Dashboard />}
      {module === "financeiro" && <Financeiro addLog={addLog} />}
      {module === "projetos" && <Projetos addLog={addLog} />}
      {module === "relatorios" && <Relatorios />}
      {module === "cadastros" && <Cadastros addLog={addLog} />}
    </main>
  </div>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
