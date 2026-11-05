import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LoadingState, ErrorState } from "./StatusMessage";
import AlteracoesAuditoria from "./AlteracoesAuditoria";
import { getHistorico } from "@/api/auditorias";
import { corAcao, corAcaoPadrao, formatarDataHora, podeVerAuditoria, rotuloAcao, rotuloRecurso } from "@/lib/auditoria";
import { useAuth } from "@/context/AuthContext";
import type { RegistroAuditoria } from "@/types/financeiro";

function DrawerHistorico({ recursoTipo, recursoId, titulo, onClose }: {
  recursoTipo: string;
  recursoId: number;
  titulo: string;
  onClose: () => void;
}) {
  const [itens, setItens] = useState<RegistroAuditoria[]>([]);
  const [proximoCursor, setProximoCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async (cursor?: number) => {
    setLoading(true);
    setError(null);
    try {
      const pagina = await getHistorico(recursoTipo, recursoId, cursor);
      setItens(anteriores => (cursor ? [...anteriores, ...pagina.itens] : pagina.itens));
      setProximoCursor(pagina.proximoCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void carregar(); }, [recursoTipo, recursoId]);

  // Portal: os botões ficam em linhas com opacity-0 até o hover, e a opacidade
  // do pai esconderia o drawer junto. stopPropagation: eventos de portal ainda
  // sobem pela árvore do React até a linha.
  return createPortal(
    <div onClick={e => e.stopPropagation()}>
      <div className="fixed inset-0 z-40 bg-[#0f1e3d]/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[440px] bg-white shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] shrink-0 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1">
              Histórico · {rotuloRecurso[recursoTipo] ?? recursoTipo} #{recursoId}
            </p>
            <h2 className="font-semibold text-[var(--foreground)] truncate">{titulo}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && <ErrorState message={error} />}
          {!error && !loading && itens.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-10">
              Nenhuma alteração registrada. Alterações anteriores à auditoria não aparecem aqui.
            </p>
          )}
          <ol className="relative border-l border-[var(--border)] ml-1.5 space-y-5">
            {itens.map(r => (
              <li key={r.id} className="pl-5 relative">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1a3a6b]/40 ring-4 ring-white" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${corAcao[r.acao] ?? corAcaoPadrao}`}>
                    {rotuloAcao[r.acao] ?? r.acao}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{formatarDataHora(r.dataHora)}</span>
                </div>
                <p className="text-sm text-[var(--foreground)] mt-1">{r.usuario?.nome ?? "Usuário não identificado"}</p>
                <div className="mt-2"><AlteracoesAuditoria registro={r} /></div>
              </li>
            ))}
          </ol>
          {loading && <LoadingState />}
          {!loading && proximoCursor !== null && (
            <div className="text-center pt-4">
              <button onClick={() => carregar(proximoCursor)} className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors cursor-pointer">
                Carregar mais
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Abre o histórico de auditoria de um registro. Não aparece para quem não tem acesso ao log. */
export default function BotaoHistorico({ recursoTipo, recursoId, titulo, className }: {
  recursoTipo: string;
  recursoId: number;
  titulo: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [aberto, setAberto] = useState(false);
  if (!podeVerAuditoria(user?.perfil)) return null;

  const abrir = (e: React.MouseEvent) => {
    // Dentro de linhas clicáveis, não dispara a ação da linha.
    e.stopPropagation();
    setAberto(true);
  };

  return (
    <>
      <button onClick={abrir} title="Histórico de alterações"
        className={className ?? "text-xs text-[var(--muted-foreground)] hover:text-[#1a3a6b] hover:underline cursor-pointer"}>
        Histórico
      </button>
      {aberto && <DrawerHistorico recursoTipo={recursoTipo} recursoId={recursoId} titulo={titulo} onClose={() => setAberto(false)} />}
    </>
  );
}
