import React, { useCallback, useEffect, useRef, useState } from "react";
import { LoadingState, ErrorState } from "./StatusMessage";
import { selectCls, chevronBg } from "./ModalShell";
import AlteracoesAuditoria from "./AlteracoesAuditoria";
import CampoData from "./CampoData";
import { exportarAuditoriaCsv, getAuditoria } from "@/api/auditorias";
import { corAcao, corAcaoPadrao, formatarDataHora, rotuloAcao, rotuloRecurso } from "@/lib/auditoria";
import { rotuloPerfil } from "@/lib/rotulos";
import type { FiltroAuditoria, Perfil, RegistroAuditoria } from "@/types/financeiro";

const inputCls =
  "h-9 px-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors";

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

function Linha({ registro }: { registro: RegistroAuditoria }) {
  const [aberto, setAberto] = useState(false);
  const temDetalhe = Object.keys(registro.alteracoes ?? {}).length > 0 || registro.ip || registro.requestId;
  const perfil = registro.perfil ? rotuloPerfil[registro.perfil as Perfil] ?? registro.perfil : null;

  return (
    <>
      <tr
        onClick={() => temDetalhe && setAberto(a => !a)}
        className={`border-t border-[var(--border)] transition-colors ${temDetalhe ? "cursor-pointer hover:bg-[var(--muted)]" : ""}`}
      >
        <td className="px-5 py-3 text-xs font-mono text-[var(--muted-foreground)] whitespace-nowrap">{formatarDataHora(registro.dataHora)}</td>
        <td className="px-5 py-3">
          <p className="text-sm text-[var(--foreground)]">{registro.usuario?.nome ?? "—"}</p>
          {perfil && <p className="text-[10px] text-[var(--muted-foreground)]">{perfil}</p>}
        </td>
        <td className="px-5 py-3">
          <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${corAcao[registro.acao] ?? corAcaoPadrao}`}>
            {rotuloAcao[registro.acao] ?? registro.acao}
          </span>
        </td>
        <td className="px-5 py-3 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
          {rotuloRecurso[registro.recursoTipo] ?? registro.recursoTipo}
          {registro.recursoId && registro.recursoTipo !== "rota" && <span className="font-mono"> #{registro.recursoId}</span>}
        </td>
        <td className="px-5 py-3 text-sm text-[var(--foreground)]">{registro.resumo}</td>
        <td className="px-3 py-3 text-[var(--muted-foreground)]">
          {temDetalhe && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${aberto ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
          )}
        </td>
      </tr>
      {aberto && (
        <tr className="bg-[#f8f9fc]">
          <td colSpan={6} className="px-5 py-4 space-y-3">
            <AlteracoesAuditoria registro={registro} />
            <p className="text-[10px] font-mono text-[var(--muted-foreground)] break-all">
              IP {registro.ip ?? "—"} · Requisição {registro.requestId ?? "—"}
              {registro.userAgent && <> · {registro.userAgent}</>}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Auditoria() {
  const [filtro, setFiltro] = useState<FiltroAuditoria>({});
  const [itens, setItens] = useState<RegistroAuditoria[]>([]);
  const [proximoCursor, setProximoCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Descarta respostas de filtros antigos que cheguem depois da atual.
  const consulta = useRef(0);

  const carregar = useCallback(async (cursor?: number) => {
    const atual = ++consulta.current;
    if (cursor) setCarregandoMais(true); else setLoading(true);
    setError(null);
    try {
      const pagina = await getAuditoria(filtro, cursor);
      if (atual !== consulta.current) return;
      setItens(anteriores => (cursor ? [...anteriores, ...pagina.itens] : pagina.itens));
      setProximoCursor(pagina.proximoCursor);
    } catch (err) {
      if (atual === consulta.current) setError(err instanceof Error ? err.message : "Não foi possível carregar a auditoria.");
    } finally {
      if (atual === consulta.current) {
        setLoading(false);
        setCarregandoMais(false);
      }
    }
  }, [filtro]);

  useEffect(() => { void carregar(); }, [carregar]);

  const set = (campo: keyof FiltroAuditoria) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFiltro(f => ({ ...f, [campo]: e.target.value || undefined }));

  const periodoInvalido = !!filtro.de && !!filtro.ate && filtro.de > filtro.ate;

  const exportar = async () => {
    setExportando(true);
    setError(null);
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      baixar(await exportarAuditoriaCsv(filtro), `auditoria-financeiro-${hoje}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível exportar a auditoria.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[var(--foreground)]">Auditoria</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Quem alterou o quê no financeiro, e quando. Os registros não podem ser editados nem apagados.
          </p>
        </div>
        <button onClick={exportar} disabled={exportando || periodoInvalido}
          className="text-xs bg-[#1a3a6b] text-white rounded px-3 py-1.5 hover:bg-[#142e57] disabled:opacity-60 transition-colors cursor-pointer">
          {exportando ? "Exportando…" : "Exportar CSV"}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap items-end gap-3">
          <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
            <span className="block mb-1">De</span>
            <CampoData value={filtro.de ?? ""} onChange={v => setFiltro(f => ({ ...f, de: v || undefined }))} className={inputCls + " w-32"} ariaLabel="Data inicial" />
          </label>
          <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
            <span className="block mb-1">Até</span>
            <CampoData value={filtro.ate ?? ""} onChange={v => setFiltro(f => ({ ...f, ate: v || undefined }))} className={inputCls + " w-32"} ariaLabel="Data final" />
          </label>
          <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] w-48">
            <span className="block mb-1">Ação</span>
            <select value={filtro.acao ?? ""} onChange={set("acao")} className={selectCls + " h-9 text-xs"} style={chevronBg}>
              <option value="">Todas</option>
              {Object.entries(rotuloAcao).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] w-48">
            <span className="block mb-1">Registro</span>
            <select value={filtro.recursoTipo ?? ""} onChange={set("recursoTipo")} className={selectCls + " h-9 text-xs"} style={chevronBg}>
              <option value="">Todos</option>
              {Object.entries(rotuloRecurso).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </label>
          {Object.keys(filtro).some(k => filtro[k as keyof FiltroAuditoria]) && (
            <button onClick={() => setFiltro({})} className="h-9 text-xs text-[#0e7e6e] hover:underline cursor-pointer">Limpar filtros</button>
          )}
        </div>

        {periodoInvalido ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">Período inválido: a data inicial deve ser anterior ou igual à final.</p>
        ) : error ? (
          <div className="p-4"><ErrorState message={error} /></div>
        ) : loading ? <LoadingState /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                  {["Data e hora", "Usuário", "Ação", "Registro", "Resumo", ""].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">Nenhum registro encontrado.</td></tr>
                )}
                {itens.map(r => <Linha key={r.id} registro={r} />)}
              </tbody>
            </table>
            {proximoCursor !== null && (
              <div className="p-4 border-t border-[var(--border)] text-center">
                <button onClick={() => carregar(proximoCursor)} disabled={carregandoMais}
                  className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] disabled:opacity-60 transition-colors cursor-pointer">
                  {carregandoMais ? "Carregando…" : "Carregar mais"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
