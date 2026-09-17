import React, { useState } from "react";
import { projetos } from '@/data';
import { fmt } from '@/lib/format';

const statusColors: Record<string, string> = {
  "Em andamento": "bg-emerald-100 text-emerald-800",
  Planejamento: "bg-amber-100 text-amber-800",
  Concluído: "bg-slate-100 text-slate-600",
};
const todasTags = Array.from(new Set(projetos.flatMap(p => p.tags)));
const anosDisponiveis = Array.from(new Set(projetos.flatMap(p => [p.inicioAno, p.fimAno]))).sort();

export default function Projetos() {
  const [tagsAtivas, setTagsAtivas] = useState<string[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [anoFiltro, setAnoFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const toggleTag = (tag: string) =>
    setTagsAtivas(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const filtrados = projetos.filter(p => {
    const matchStatus = statusFiltro === "todos" || p.status === statusFiltro;
    const matchTags = tagsAtivas.length === 0 || tagsAtivas.every(t => p.tags.includes(t));
    const matchAno = anoFiltro === "todos" || p.inicioAno === parseInt(anoFiltro) || p.fimAno === parseInt(anoFiltro);
    const matchBusca = busca === "" || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchTags && matchAno && matchBusca;
  });

  const hasFilters = tagsAtivas.length > 0 || statusFiltro !== "todos" || anoFiltro !== "todos" || busca !== "";

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[var(--foreground)]">Projetos</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {filtrados.length} de {projetos.length} iniciativas
            {hasFilters && <button onClick={() => { setTagsAtivas([]); setStatusFiltro("todos"); setAnoFiltro("todos"); setBusca(""); }} className="ml-2 text-[#0e7e6e] hover:underline cursor-pointer">Limpar filtros</button>}
          </p>
        </div>
        <button className="text-xs bg-[#1a3a6b] text-white rounded px-3 py-1.5 hover:bg-[#142e57] transition-colors cursor-pointer">
          + Novo Projeto
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 space-y-3">
        {/* linha 1: busca + status + ano */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar projeto…" value={busca} onChange={e => setBusca(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors" />
          </div>

          {/* Status */}
          <div className="flex rounded-md border border-[var(--border)] overflow-hidden bg-white text-xs">
            {["todos", "Em andamento", "Planejamento", "Concluído"].map(s => (
              <button key={s} onClick={() => setStatusFiltro(s)}
                className={`px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${statusFiltro === s ? "bg-[#0f1e3d] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}>
                {s === "todos" ? "Todos os status" : s}
              </button>
            ))}
          </div>

          {/* Ano */}
          <select value={anoFiltro} onChange={e => setAnoFiltro(e.target.value)}
            className="h-9 px-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors appearance-none pr-7"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
            <option value="todos">Todos os anos</option>
            {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* linha 2: tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] shrink-0">Tags</span>
          {todasTags.map(tag => {
            const ativa = tagsAtivas.includes(tag);
            return (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${ativa ? "bg-[#0f1e3d] text-white border-[#0f1e3d]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#0f1e3d]/40 hover:text-[var(--foreground)]"}`}>
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {filtrados.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center">
          <p className="text-[var(--muted-foreground)] text-sm">Nenhum projeto corresponde aos filtros selecionados.</p>
          <button onClick={() => { setTagsAtivas([]); setStatusFiltro("todos"); setAnoFiltro("todos"); setBusca(""); }}
            className="mt-3 text-xs text-[#0e7e6e] hover:underline cursor-pointer">Limpar filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtrados.map((p, i) => {
            const pct = p.orcamento > 0 ? Math.round((p.realizado / p.orcamento) * 100) : 0;
            return (
              <div key={i} className="bg-white rounded-lg border border-[var(--border)] p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.cor }} />
                      <h2 className="font-semibold text-[var(--foreground)] truncate">{p.nome}</h2>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{p.descricao}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-3 ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] font-mono mb-3">
                  <span>Início {p.inicio}</span>
                  <span>·</span>
                  <span>Fim {p.fim}</span>
                  <span>·</span>
                  <span>{p.duracao}</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {p.tags.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${tagsAtivas.includes(tag) ? "bg-[#0f1e3d] text-white border-[#0f1e3d]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#0f1e3d]/40"}`}>
                      {tag}
                    </button>
                  ))}
                </div>

                {p.orcamento > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[var(--muted-foreground)]">Execução orçamentária</span>
                      <span className="text-xs font-mono font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.cor }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs font-mono text-[var(--muted-foreground)]">
                      <span>{fmt(p.realizado)} realizado</span>
                      <span>{fmt(p.orcamento)} total</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Relatórios ──────────────────────────────────────────────────────────────

