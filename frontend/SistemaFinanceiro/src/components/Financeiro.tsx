import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmt, formatDate } from '@/lib/format';
import { type LogEntry } from './NavBar';
import { SummaryCard } from './Dashboard';
import { LoadingState, ErrorState } from './StatusMessage';
import { ModalShell, FieldMd, inputMdCls, selectCls, chevronBg } from './ModalShell';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useProjetos } from '@/hooks/useProjetos';
import { useContas } from '@/hooks/useContas';
import { useCategorias } from '@/hooks/useCategorias';
import { getAnexos, createAnexo, removeAnexo as apiRemoveAnexo } from '@/api/anexos';
import { dataDoLancamento, getIntervaloPeriodo, resumoPeriodo, saldoTotalContas, serieSemanalMesAtual } from '@/lib/aggregations';
import { corSituacao, rotuloSituacao, valorComSinal } from '@/lib/rotulos';
import type { Anexo, Lancamento, NovoLancamento, SituacaoLancamento, TipoLancamento } from '@/types/financeiro';

type FinanceTab = "lancamentos" | "entradas" | "saidas" | "fluxo";

// O backend ainda não tem endpoints de anexo; a coluna de comprovantes volta
// quando eles existirem (ver src/api/anexos.ts).
const ANEXOS_DISPONIVEIS = false;

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
function DrawerComprovantes({ lancamento, anexos, loading, onClose, onAddAnexos, onRemoveAnexo }: {
  lancamento: Lancamento;
  anexos: Anexo[];
  loading: boolean;
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
                <span className="text-xs font-mono text-[var(--muted-foreground)]">{formatDate(dataDoLancamento(lancamento))}</span>
                <span className="text-[var(--muted-foreground)]">·</span>
                <span className={`text-xs font-mono font-semibold ${lancamento.tipo === "entrada" ? "text-[#0e7e6e]" : "text-red-600"}`}>
                  {lancamento.tipo === "entrada" ? "+" : ""}{fmt(valorComSinal(lancamento.valor, lancamento.tipo))}
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
          {loading ? <LoadingState label="Carregando comprovantes…" /> : anexos.length === 0 ? (
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
                    <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{fmtBytes(a.tamanho)} · {new Date(a.dataUpload).toLocaleDateString("pt-BR")}</p>
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

// ── Modal Novo Lançamento ─────────────────────────────────────────────────────
const tiposLancamento: { value: TipoLancamento; label: string }[] = [
  { value: "entrada", label: "Entrada" },
  { value: "saida", label: "Saída" },
];
const situacoesLancamento: SituacaoLancamento[] = ["pendente", "pago", "recebido"];

function ModalNovoLancamento({ projetos, contas, categorias, onClose, onSave }: {
  projetos: { id: number; nome: string }[];
  contas: { id: number; nome: string }[];
  categorias: { id: number; nome: string }[];
  onClose: () => void;
  onSave: (input: NovoLancamento) => Promise<void>;
}) {
  const [form, setForm] = useState({
    dataCompetencia: "", descricao: "", projetoId: "", contaId: "", categoriaId: "", valor: "",
    tipo: "entrada" as TipoLancamento, situacao: "pendente" as SituacaoLancamento,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        dataCompetencia: form.dataCompetencia,
        descricao: form.descricao,
        projetoId: form.projetoId ? Number(form.projetoId) : undefined,
        contaId: Number(form.contaId),
        categoriaId: Number(form.categoriaId),
        valor: form.valor,
        tipo: form.tipo,
        situacao: form.situacao,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o lançamento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Novo lançamento" subtitle="Registrar entrada ou saída financeira"
      onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar lançamento"
      submitting={submitting} error={error}
    >
      <div className="grid grid-cols-2 gap-3">
        <FieldMd label="Tipo" required>
          <div className="grid grid-cols-2 gap-2">
            {tiposLancamento.map(t => (
              <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                className={`h-10 rounded-md border text-sm font-medium transition-all cursor-pointer ${
                  form.tipo === t.value
                    ? t.value === "entrada" ? "border-[#0e7e6e] bg-[#0e7e6e]/10 text-[#0e7e6e]" : "border-red-400 bg-red-50 text-red-600"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </FieldMd>
        <FieldMd label="Situação" required>
          <select required value={form.situacao} onChange={set("situacao")} className={selectCls} style={chevronBg}>
            {situacoesLancamento.map(s => <option key={s} value={s}>{rotuloSituacao[s]}</option>)}
          </select>
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Descrição" required>
            <input type="text" required value={form.descricao} onChange={set("descricao")} placeholder="Ex: Convênio SEDES — Parcela 3" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Data" required>
          <input type="date" required value={form.dataCompetencia} onChange={set("dataCompetencia")} className={inputMdCls + " font-mono"} />
        </FieldMd>
        <FieldMd label="Valor (R$)" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] font-mono select-none">R$</span>
            <input type="number" required min="0" step="0.01" value={form.valor} onChange={set("valor")} placeholder="0,00" className={inputMdCls + " pl-10 font-mono"} />
          </div>
        </FieldMd>
        <FieldMd label="Conta" required>
          <select required value={form.contaId} onChange={set("contaId")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Categoria" required>
          <select required value={form.categoriaId} onChange={set("categoriaId")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Projeto">
            <select value={form.projetoId} onChange={set("projetoId")} className={selectCls} style={chevronBg}>
              <option value="">Nenhum</option>
              {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </FieldMd>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Financeiro ────────────────────────────────────────────────────────────────
export default function Financeiro({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const { data: lancamentos, loading: loadingLancamentos, error: errorLancamentos, create: createLancamento } = useLancamentos();
  const { data: projetos, loading: loadingProjetos } = useProjetos();
  const { data: contas, loading: loadingContas, error: errorContas } = useContas();
  const { data: categorias, loading: loadingCategorias } = useCategorias();

  const [tab, setTab] = useState<FinanceTab>("lancamentos");
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [anexosPorLanc, setAnexosPorLanc] = useState<Record<number, Anexo[]>>({});
  const [anexosLoading, setAnexosLoading] = useState(false);
  const [modalNovo, setModalNovo] = useState(false);

  const loading = loadingLancamentos || loadingProjetos || loadingContas || loadingCategorias;

  const nomeProjeto = useMemo(() => new Map(projetos.map(p => [p.id, p.nome])), [projetos]);
  const nomeConta = useMemo(() => new Map(contas.map(c => [c.id, c.nome])), [contas]);
  const error = errorLancamentos ?? errorContas;

  useEffect(() => {
    if (drawerId === null) return;
    let cancelado = false;
    setAnexosLoading(true);
    getAnexos(drawerId)
      .then(lista => { if (!cancelado) setAnexosPorLanc(prev => ({ ...prev, [drawerId]: lista })); })
      .catch(() => { /* mantém a lista vazia; a mensagem de erro geral já cobre o caso */ })
      .finally(() => { if (!cancelado) setAnexosLoading(false); });
    return () => { cancelado = true; };
  }, [drawerId]);

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
  const totalSaidas = filtered.filter((l) => l.tipo === "saida").reduce((a, b) => a + b.valor, 0);

  const mesAtualLabel = useMemo(() => {
    const texto = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }, []);
  const resumoMes = useMemo(() => resumoPeriodo(lancamentos, getIntervaloPeriodo("mes")), [lancamentos]);
  const saldoContas = useMemo(() => saldoTotalContas(contas), [contas]);
  const barData = useMemo(() => serieSemanalMesAtual(lancamentos), [lancamentos]);

  const drawerLancamento = drawerId !== null ? lancamentos.find(l => l.id === drawerId) ?? null : null;

  const addAnexos = async (lancamentoId: number, files: FileList) => {
    const lancamento = lancamentos.find(l => l.id === lancamentoId);
    for (const file of Array.from(files)) {
      const anexo = await createAnexo(lancamentoId, file);
      setAnexosPorLanc(prev => ({ ...prev, [lancamentoId]: [...(prev[lancamentoId] ?? []), anexo] }));
      addLog({
        modulo: "Financeiro",
        acao: "anexo",
        descricao: `Comprovante anexado ao lançamento "${lancamento?.descricao ?? ""}"`,
        detalhe: `${anexo.nome} · ${fmtBytes(anexo.tamanho)}`,
      });
    }
  };

  const removeAnexoHandler = async (lancamentoId: number, anexoId: string) => {
    const lancamento = lancamentos.find(l => l.id === lancamentoId);
    const anexo = anexosPorLanc[lancamentoId]?.find(a => a.id === anexoId);
    await apiRemoveAnexo(anexoId);
    setAnexosPorLanc(prev => ({ ...prev, [lancamentoId]: (prev[lancamentoId] ?? []).filter(a => a.id !== anexoId) }));
    if (anexo) addLog({
      modulo: "Financeiro",
      acao: "remoção",
      descricao: `Comprovante removido do lançamento "${lancamento?.descricao ?? ""}"`,
      detalhe: anexo.nome,
    });
  };

  const handleSaveLancamento = async (input: NovoLancamento) => {
    const criado = await createLancamento(input);
    addLog({
      modulo: "Financeiro",
      acao: "adição",
      descricao: `Novo lançamento registrado: ${criado.descricao}`,
      detalhe: `${criado.tipo === "entrada" ? "+" : "-"}${fmt(criado.valor)} · ${nomeConta.get(criado.contaId) ?? ""}`,
    });
  };

  return (
    <>
      {modalNovo && (
        <ModalNovoLancamento
          projetos={projetos}
          contas={contas}
          categorias={categorias}
          onClose={() => setModalNovo(false)}
          onSave={handleSaveLancamento}
        />
      )}

      {ANEXOS_DISPONIVEIS && drawerLancamento && (
        <DrawerComprovantes
          lancamento={drawerLancamento}
          anexos={anexosPorLanc[drawerLancamento.id] ?? []}
          loading={anexosLoading}
          onClose={() => setDrawerId(null)}
          onAddAnexos={files => addAnexos(drawerLancamento.id, files)}
          onRemoveAnexo={id => removeAnexoHandler(drawerLancamento.id, id)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[var(--foreground)]">Financeiro</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{mesAtualLabel}</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors">
              Período ▾
            </button>
            <button onClick={() => setModalNovo(true)} className="text-xs bg-[#1a3a6b] text-white rounded px-3 py-1.5 hover:bg-[#142e57] transition-colors cursor-pointer">
              + Lançamento
            </button>
          </div>
        </div>

        {error && <ErrorState message={error} />}

        {loading ? <LoadingState /> : (
          <>
            <div className="grid grid-cols-4 gap-4">
              <SummaryCard label="Total entradas" value={fmt(resumoMes.entradas)} sub={mesAtualLabel} color="text-[#0e7e6e]" />
              <SummaryCard label="Total saídas" value={fmt(resumoMes.saidas)} sub={mesAtualLabel} color="text-red-600" />
              <SummaryCard label="Saldo do período" value={fmt(resumoMes.entradas - resumoMes.saidas)} sub="Resultado operacional" />
              <SummaryCard label="Saldo das contas" value={fmt(saldoContas)} sub={contas.map(c => c.nome).join(" + ") || "Nenhuma conta cadastrada"} />
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
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">Entradas vs. Saídas por semana — {mesAtualLabel}</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ fontSize: 12, border: "1px solid #d4dae7", borderRadius: 6 }} />
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
                        {["Data", "Descrição", "Projeto", "Conta", "Valor", "Situação", ...(ANEXOS_DISPONIVEIS ? ["Comprovantes"] : [])].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l) => {
                        const qtd = (anexosPorLanc[l.id] ?? []).length;
                        return (
                          <tr key={l.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                            <td className="px-5 py-3 text-xs font-mono text-[var(--muted-foreground)] whitespace-nowrap">{formatDate(dataDoLancamento(l))}</td>
                            <td className="px-5 py-3 font-medium text-[var(--foreground)]">{l.descricao}</td>
                            <td className="px-5 py-3 text-[var(--muted-foreground)]">{l.projetoId ? nomeProjeto.get(l.projetoId) ?? "—" : "—"}</td>
                            <td className="px-5 py-3 text-[var(--muted-foreground)] whitespace-nowrap">{nomeConta.get(l.contaId) ?? "—"}</td>
                            <td className={`px-5 py-3 font-mono font-medium whitespace-nowrap ${l.tipo === "entrada" ? "text-[#0e7e6e]" : "text-red-600"}`}>
                              {l.tipo === "entrada" ? "+" : ""}{fmt(valorComSinal(l.valor, l.tipo))}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corSituacao[l.situacao]}`}>
                                {rotuloSituacao[l.situacao]}
                              </span>
                            </td>
                            {ANEXOS_DISPONIVEIS && <td className="px-5 py-3">
                              <button
                                onClick={() => setDrawerId(l.id)}
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                                  qtd > 0
                                    ? "border-[#1a3a6b]/30 bg-[#1a3a6b]/5 text-[#1a3a6b] hover:bg-[#1a3a6b]/10"
                                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#1a3a6b]/30 hover:text-[#1a3a6b]"
                                }`}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                                {qtd > 0 ? `${qtd} arquivo${qtd > 1 ? "s" : ""}` : "Anexar"}
                              </button>
                            </td>}
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
                        <td colSpan={ANEXOS_DISPONIVEIS ? 2 : 1} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
