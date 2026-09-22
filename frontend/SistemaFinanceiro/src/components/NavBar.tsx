import React, { useState } from "react";
import mdcaLogo from '@/imports/coisaaa.png';
import { useAuth } from "@/context/AuthContext";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export type Module = 'inicio' | 'financeiro' | 'projetos' | 'relatorios' | 'cadastros';

type LogModulo = "Financeiro" | "Cadastros" | "Projetos" | "Relatórios";
type LogAcao = "adição" | "remoção" | "edição" | "anexo";
export interface LogEntry {
  id: string;
  timestamp: Date;
  modulo: LogModulo;
  acao: LogAcao;
  descricao: string;
  detalhe?: string;
}
const acaoCor: Record<LogAcao, string> = {
  adição: "text-[#0e7e6e] bg-[#0e7e6e]/10",
  remoção: "text-red-600 bg-red-50",
  edição: "text-[#1a3a6b] bg-[#1a3a6b]/10",
  anexo: "text-amber-700 bg-amber-50",
};
const moduloCor: Record<LogModulo, string> = {
  Financeiro: "bg-[#0e7e6e]/10 text-[#0e7e6e]",
  Cadastros: "bg-[#1a3a6b]/10 text-[#1a3a6b]",
  Projetos: "bg-violet-100 text-violet-700",
  "Relatórios": "bg-amber-100 text-amber-700",
}
function fmtRelativo(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("pt-BR");
}

export default function NavBar({ active, setModule, logs, onClearLogs }: {
  active: Module;
  setModule: (m: Module) => void;
  logs: LogEntry[];
  onClearLogs: () => void;
}) {
  const { user } = useAuth();
  const [logOpen, setLogOpen] = useState(false);
  const [vistosAte, setVistosAte] = useState(0);
  const novos = logs.length - vistosAte;

  const items: { key: Module; label: string }[] = [
    { key: "inicio", label: "Início" },
    { key: "financeiro", label: "Financeiro" },
    { key: "projetos", label: "Projetos" },
    { key: "relatorios", label: "Relatórios" },
    { key: "cadastros", label: "Cadastros" },
  ];

  const abrirLog = () => {
    setLogOpen(o => !o);
    setVistosAte(logs.length);
  };

  return (
    <header className="bg-[#0f1e3d] text-white sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center h-14 gap-8">
        <div className="flex items-center gap-2 mr-4">
          <img src={mdcaLogo} alt="MDCA" className="w-8 h-8 rounded-full object-contain bg-white" />
          <span className="font-serif text-lg leading-none tracking-tight">Financeiro MDCA</span>
          <span className="text-xs text-[#0e7e6e] font-mono uppercase tracking-widest ml-1 mt-0.5">Sistema</span>
        </div>
        <nav className="flex items-center gap-1">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => setModule(item.key)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
                active === item.key
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-white/40 font-mono">DEMO</span>

          {/* Botão de log de atividades */}
          <div className="relative">
            <button
              onClick={abrirLog}
              className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              title="Log de atividades"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              {novos > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#0e7e6e] rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
                  {novos > 99 ? "99+" : novos}
                </span>
              )}
            </button>

            {/* Painel de log */}
            {logOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLogOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-[400px] bg-white rounded-xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden max-h-[520px]">
                  {/* header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">Log de atividades</p>
                      <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-0.5">{logs.length} registros</p>
                    </div>
                    <button
                      onClick={() => { onClearLogs(); setVistosAte(0); }}
                      className="text-[10px] font-mono text-[var(--muted-foreground)] hover:text-red-600 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-red-50"
                    >
                      Limpar tudo
                    </button>
                  </div>

                  {/* lista */}
                  <div className="overflow-y-auto flex-1">
                    {logs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <p className="text-sm font-medium text-[var(--muted-foreground)]">Nenhuma atividade registrada</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">As ações do sistema aparecerão aqui.</p>
                      </div>
                    ) : (
                      <div>
                        {logs.slice().reverse().map((entry, i) => (
                          <div
                            key={entry.id}
                            className={`flex gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 ${i === 0 && novos > 0 ? "" : ""}`}
                          >
                            {/* dot de ação */}
                            <div className="shrink-0 mt-0.5">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${acaoCor[entry.acao]}`}>
                                {entry.acao === "adição" ? "+" : entry.acao === "remoção" ? "−" : entry.acao === "anexo" ? "📎" : "✎"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-[var(--foreground)] leading-snug">{entry.descricao}</p>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wide font-semibold ${moduloCor[entry.modulo]}`}>
                                  {entry.modulo}
                                </span>
                              </div>
                              {entry.detalhe && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{entry.detalhe}</p>
                              )}
                              <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-1">{fmtRelativo(entry.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* rodapé */}
                  {logs.length > 0 && (
                    <div className="px-4 py-2 border-t border-[var(--border)] shrink-0 bg-[var(--muted)]">
                      <p className="text-[10px] font-mono text-[var(--muted-foreground)]">
                        Sessão iniciada hoje · {logs.length} ação{logs.length !== 1 ? "ões" : ""} registrada{logs.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div
            className="w-7 h-7 rounded-full bg-[#0e7e6e]/30 flex items-center justify-center text-xs font-semibold text-[#0e7e6e]"
            title={user?.nome}
          >
            {user ? iniciais(user.nome) : "?"}
          </div>
        </div>
      </div>
    </header>
  );
}

