import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmt } from '@/lib/format';
import { lancamentos } from '@/data';
import { type LogEntry } from './NavBar';
import { SummaryCard } from './Dashboard';

type FinanceTab = "lancamentos" | "entradas" | "saidas" | "fluxo";
type Anexo = { id: string; nome: string; tipo: string; tamanho: number; url: string; dataUpload: string };

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function iconeAnexo(tipo: string) {
  if (tipo.startsWith("image/")) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  );
  if (tipo === "application/pdf") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  );
}

// ── Drawer de comprovantes ────────────────────────────────────────────────────
function DrawerComprovantes({ lancamento, anexos, onClose, onAddAnexos, onRemoveAnexo }: {
  lancamento: typeof lancamentos[0];
  anexos: Anexo[];
  onClose: () => void;
  onAddAnexos: (files: FileList) => void;
  onRemoveAnexo: (id: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<Anexo | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onAddAnexos(e.dataTransfer.files);
  };

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 z-40 bg-[#0f1e3d]/30 backdrop-blur-[1px]" onClick={onClose} />

      {/* drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] bg-white shadow-2xl flex flex-col">
        {/* header */}
        <div className="px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Comprovantes</p>
              <h2 className="font-semibold text-[var(--foreground)] leading-snug truncate">{lancamento.descricao}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-[var(--muted-foreground)]">{lancamento.data}</span>
                <span className="text-[var(--muted-foreground)]">·</span>
                <span className={`text-xs font-mono font-semibold ${lancamento.valor >= 0 ? "text-[#0e7e6e]" : "text-red-600"}`}>
                  {lancamento.valor >= 0 ? "+" : ""}{fmt(lancamento.valor)}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* zona de upload */}
        <div className="px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg px-5 py-6 text-center cursor-pointer transition-colors ${dragging ? "border-[#0e7e6e] bg-[#0e7e6e]/5" : "border-[var(--border)] hover:border-[#1a3a6b]/40 hover:bg-[var(--muted)]"}`}
          >
            <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.xml" className="hidden"
              onChange={e => e.target.files && onAddAnexos(e.target.files)} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${dragging ? "bg-[#0e7e6e]/10" : "bg-[var(--muted)]"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dragging ? "#0e7e6e" : "#6b7a99"} strokeWidth="1.8">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)] mb-0.5">
              {dragging ? "Solte os arquivos aqui" : "Arraste ou clique para anexar"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">PDF, imagem (JPG, PNG) ou XML de NF-e · máx. 10 MB</p>
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={() => inputRef.current?.click()}
              className="flex-1 h-9 text-xs border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Selecionar arquivo
            </button>
            <button className="flex-1 h-9 text-xs border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[var(--muted-foreground)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Digitalizar
            </button>
          </div>
        </div>

        {/* lista de anexos */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {anexos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Nenhum comprovante anexado</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Adicione nota fiscal, recibo ou outro documento acima.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                {anexos.length} arquivo{anexos.length > 1 ? "s" : ""} anexado{anexos.length > 1 ? "s" : ""}
              </p>
              {anexos.map(a => (
                <div key={a.id} className="group flex items-center gap-3 border border-[var(--border)] rounded-lg p-3 hover:border-[#1a3a6b]/30 hover:bg-[var(--muted)] transition-all">
                  {/* thumb ou ícone */}
                  {a.tipo.startsWith("image/") ? (
                    <div
                      className="w-12 h-12 rounded-md overflow-hidden shrink-0 border border-[var(--border)] cursor-pointer bg-[var(--muted)]"
                      onClick={() => setPreview(a)}
                    >
                      <img src={a.url} alt={a.nome} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-[var(--muted)] flex items-center justify-center shrink-0 text-[var(--muted-foreground)]">
                      {iconeAnexo(a.tipo)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{a.nome}</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{fmtBytes(a.tamanho)} · {a.dataUpload}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={a.url} download={a.nome} target="_blank" rel="noreferrer"
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1a3a6b]/10 text-[#1a3a6b] transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </a>
                    {a.tipo.startsWith("image/") && (
                      <button onClick={() => setPreview(a)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1a3a6b]/10 text-[#1a3a6b] transition-colors cursor-pointer">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    )}
                    <button onClick={() => onRemoveAnexo(a.id)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-500 transition-colors cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* rodapé */}
        <div className="px-6 py-3 border-t border-[var(--border)] shrink-0 bg-[var(--muted)]">
          <p className="text-[10px] font-mono text-[var(--muted-foreground)]">
            Formatos aceitos: PDF · JPG · PNG · XML (NF-e) · Máx. 10 MB por arquivo
          </p>
        </div>
      </div>

      {/* Lightbox de preview de imagem */}
      {preview && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl max-h-[80vh] mx-4" onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.nome} className="max-w-full max-h-[75vh] rounded-lg object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-lg px-4 py-2 flex items-center justify-between">
              <p className="text-white text-xs font-medium truncate">{preview.nome}</p>
              <button onClick={() => setPreview(null)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer ml-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Financeiro ────────────────────────────────────────────────────────────────
export default function Financeiro({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const [tab, setTab] = useState<FinanceTab>("lancamentos");
  const [drawerIdx, setDrawerIdx] = useState<number | null>(null);
  const [anexosPorLanc, setAnexosPorLanc] = useState<Record<number, Anexo[]>>({});

  const tabs: { key: FinanceTab; label: string }[] = [
    { key: "lancamentos", label: "Lançamentos" },
    { key: "entradas", label: "Entradas" },
    { key: "saidas", label: "Saídas" },
    { key: "fluxo", label: "Fluxo de Caixa" },
  ];

  const filtered =
    tab === "entradas"
      ? lancamentos.filter((l) => l.tipo === "entrada")
      : tab === "saidas"
      ? lancamentos.filter((l) => l.tipo === "saida")
      : lancamentos;

  const totalEntradas = filtered.filter((l) => l.tipo === "entrada").reduce((a, b) => a + b.valor, 0);
  const totalSaidas = filtered.filter((l) => l.tipo === "saida").reduce((a, b) => a + Math.abs(b.valor), 0);

  const barData = [
    { label: "Sem 1", entradas: 18500, saidas: 12400 },
    { label: "Sem 2", entradas: 14600, saidas: 8950 },
    { label: "Sem 3", entradas: 9600, saidas: 5130 },
    { label: "Sem 4", entradas: 12000, saidas: 7200 },
  ];

  const addAnexos = (idx: number, files: FileList) => {
    const novos: Anexo[] = Array.from(files).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      nome: f.name,
      tipo: f.type || "application/octet-stream",
      tamanho: f.size,
      url: URL.createObjectURL(f),
      dataUpload: new Date().toLocaleDateString("pt-BR"),
    }));
    setAnexosPorLanc(prev => ({ ...prev, [idx]: [...(prev[idx] ?? []), ...novos] }));
    novos.forEach(a => addLog({
      modulo: "Financeiro",
      acao: "anexo",
      descricao: `Comprovante anexado ao lançamento "${lancamentos[idx].descricao}"`,
      detalhe: `${a.nome} · ${fmtBytes(a.tamanho)}`,
    }));
  };

  const removeAnexo = (idx: number, id: string) => {
    setAnexosPorLanc(prev => {
      const revoked = prev[idx]?.find(a => a.id === id);
      if (revoked) {
        URL.revokeObjectURL(revoked.url);
        addLog({
          modulo: "Financeiro",
          acao: "remoção",
          descricao: `Comprovante removido do lançamento "${lancamentos[idx].descricao}"`,
          detalhe: revoked.nome,
        });
      }
      return { ...prev, [idx]: (prev[idx] ?? []).filter(a => a.id !== id) };
    });
  };

  return (
    <>
      {drawerIdx !== null && (
        <DrawerComprovantes
          lancamento={lancamentos[drawerIdx]}
          anexos={anexosPorLanc[drawerIdx] ?? []}
          onClose={() => setDrawerIdx(null)}
          onAddAnexos={files => addAnexos(drawerIdx, files)}
          onRemoveAnexo={id => removeAnexo(drawerIdx, id)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[var(--foreground)]">Financeiro</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Agosto 2026</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors">
              Período ▾
            </button>
            <button className="text-xs bg-[#1a3a6b] text-white rounded px-3 py-1.5 hover:bg-[#142e57] transition-colors">
              + Lançamento
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <SummaryCard label="Total entradas" value={fmt(54700)} sub="Agosto 2026" color="text-[#0e7e6e]" />
          <SummaryCard label="Total saídas" value={fmt(18750)} sub="Agosto 2026" color="text-red-600" />
          <SummaryCard label="Saldo do período" value={fmt(35950)} sub="Resultado operacional" />
          <SummaryCard label="Saldo das contas" value={fmt(184320)} sub="C/C Bradesco + C/C Itaú" />
        </div>

        <div className="bg-white rounded-lg border border-[var(--border)]">
          <div className="border-b border-[var(--border)] px-5 flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`py-3 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  tab === t.key
                    ? "border-[#1a3a6b] text-[#1a3a6b]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "fluxo" ? (
            <div className="p-5">
              <p className="text-sm text-[var(--muted-foreground)] mb-4">Entradas vs. Saídas por semana — Agosto 2026</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, border: "1px solid #d4dae7", borderRadius: 6 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="entradas" name="Entradas" fill="#0e7e6e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#e05555" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Data", "Descrição", "Projeto", "Conta", "Valor", "Situação", "Comprovantes"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, fi) => {
                    const realIdx = lancamentos.indexOf(l);
                    const qtd = (anexosPorLanc[realIdx] ?? []).length;
                    return (
                      <tr key={fi} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                        <td className="px-5 py-3 text-xs font-mono text-[var(--muted-foreground)] whitespace-nowrap">{l.data}</td>
                        <td className="px-5 py-3 font-medium text-[var(--foreground)]">{l.descricao}</td>
                        <td className="px-5 py-3 text-[var(--muted-foreground)]">{l.projeto}</td>
                        <td className="px-5 py-3 text-[var(--muted-foreground)] whitespace-nowrap">{l.conta}</td>
                        <td className={`px-5 py-3 font-mono font-medium whitespace-nowrap ${l.valor >= 0 ? "text-[#0e7e6e]" : "text-red-600"}`}>
                          {l.valor >= 0 ? "+" : ""}{fmt(l.valor)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            l.situacao === "Recebido" ? "bg-emerald-100 text-emerald-800"
                            : l.situacao === "Pago" ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                          }`}>
                            {l.situacao}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setDrawerIdx(realIdx)}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                              qtd > 0
                                ? "border-[#1a3a6b]/30 bg-[#1a3a6b]/5 text-[#1a3a6b] hover:bg-[#1a3a6b]/10"
                                : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#1a3a6b]/30 hover:text-[#1a3a6b]"
                            }`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                            {qtd > 0 ? `${qtd} arquivo${qtd > 1 ? "s" : ""}` : "Anexar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--muted)]">
                    <td colSpan={4} className="px-5 py-3 text-xs font-mono text-[var(--muted-foreground)]">Totais do período</td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-mono">
                        <span className="text-[#0e7e6e]">+{fmt(totalEntradas)}</span>
                        {tab === "lancamentos" && <span className="text-red-600 ml-2">-{fmt(totalSaidas)}</span>}
                      </div>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

