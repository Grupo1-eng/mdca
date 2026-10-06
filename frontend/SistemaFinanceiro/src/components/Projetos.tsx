import { useMemo, useState } from "react";
import { fmt, formatDate, formatDuracao, getYear } from '@/lib/format';
import { useProjetos } from '@/hooks/useProjetos';
import { useLancamentos } from '@/hooks/useLancamentos';
import { LoadingState, ErrorState } from './StatusMessage';
import { ModalShell, FieldMd, inputMdCls, selectCls, chevronBg } from './ModalShell';
import { type LogEntry } from './NavBar';
import type { NovoProjeto, TipoProjeto } from '@/types/financeiro';

const statusColors: Record<string, string> = {
  "Em andamento": "bg-emerald-100 text-emerald-800",
  Planejamento: "bg-amber-100 text-amber-800",
  Concluído: "bg-slate-100 text-slate-600",
};

const statusOpcoes = ["Planejamento", "Em andamento", "Concluído"];
const tiposProjeto: { value: TipoProjeto; label: string }[] = [
  { value: "PROJETO", label: "Projeto" },
  { value: "SERVICO", label: "Serviço" },
  { value: "PROGRAMA", label: "Programa" },
];

// O banco não guarda cor: ela é só visual, fixa por projeto.
const cores = ["#0e7e6e", "#1a3a6b", "#7c5fbd", "#6b7a99", "#c2410c", "#0f766e"];
const corDoProjeto = (id: number) => cores[id % cores.length];

function ModalNovoProjeto({ onClose, onSave }: { onClose: () => void; onSave: (input: NovoProjeto) => Promise<void> }) {
  const [form, setForm] = useState({
    nome: "", descricao: "", tipo: "PROJETO" as TipoProjeto, status: "Planejamento",
    dataInicio: "", dataFim: "", orcamentoTotal: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        tipo: form.tipo,
        status: form.status,
        dataInicio: form.dataInicio || null,
        dataFim: form.dataFim || null,
        orcamentoTotal: form.orcamentoTotal || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o projeto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Novo projeto" subtitle="Cadastre um novo projeto ou iniciativa"
      onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar projeto"
      submitting={submitting} error={error}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldMd label="Nome do projeto" required>
            <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Projeto Semear" className={inputMdCls} />
          </FieldMd>
        </div>
        <div className="col-span-2">
          <FieldMd label="Descrição">
            <textarea value={form.descricao} onChange={set("descricao")} rows={2} placeholder="Descreva brevemente o objetivo do projeto…"
              className={inputMdCls + " h-auto py-2 resize-none"} />
          </FieldMd>
        </div>
        <FieldMd label="Tipo" required>
          <select required value={form.tipo} onChange={set("tipo")} className={selectCls} style={chevronBg}>
            {tiposProjeto.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Status" required>
          <select required value={form.status} onChange={set("status")} className={selectCls} style={chevronBg}>
            {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Orçamento total (R$)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] font-mono select-none">R$</span>
              <input type="number" min="0" step="0.01" value={form.orcamentoTotal} onChange={set("orcamentoTotal")} placeholder="0,00" className={inputMdCls + " pl-10 font-mono"} />
            </div>
          </FieldMd>
        </div>
        <FieldMd label="Início">
          <input type="date" value={form.dataInicio} onChange={set("dataInicio")} className={inputMdCls + " font-mono"} />
        </FieldMd>
        <FieldMd label="Fim previsto">
          <input type="date" value={form.dataFim} onChange={set("dataFim")} className={inputMdCls + " font-mono"} />
        </FieldMd>
      </div>
    </ModalShell>
  );
}

export default function Projetos({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const { data: projetos, loading: loadingProjetos, error: errorProjetos, create } = useProjetos();
  const { data: lancamentos, loading: loadingLancamentos, error: errorLancamentos } = useLancamentos();
  const loading = loadingProjetos || loadingLancamentos;
  const error = errorProjetos ?? errorLancamentos;
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [anoFiltro, setAnoFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);

  // Realizado = saídas já pagas lançadas no projeto.
  const realizadoPorProjeto = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const l of lancamentos) {
      if (l.projetoId === null || l.tipo !== "saida" || l.situacao !== "pago") continue;
      mapa.set(l.projetoId, (mapa.get(l.projetoId) ?? 0) + l.valor);
    }
    return mapa;
  }, [lancamentos]);

  const anosDoProjeto = (p: { dataInicio: string | null; dataFim: string | null }) =>
    [p.dataInicio, p.dataFim].filter((d): d is string => d !== null).map(getYear);

  const anosDisponiveis = useMemo(
    () => Array.from(new Set(projetos.flatMap(anosDoProjeto))).sort((a, b) => a - b),
    [projetos],
  );

  const termo = busca.toLowerCase();
  const filtrados = projetos.filter(p => {
    const matchStatus = statusFiltro === "todos" || p.status === statusFiltro;
    const matchAno = anoFiltro === "todos" || anosDoProjeto(p).includes(parseInt(anoFiltro));
    const matchBusca = termo === "" || p.nome.toLowerCase().includes(termo) || (p.descricao ?? "").toLowerCase().includes(termo);
    return matchStatus && matchAno && matchBusca;
  });

  const limparFiltros = () => { setStatusFiltro("todos"); setAnoFiltro("todos"); setBusca(""); };
  const hasFilters = statusFiltro !== "todos" || anoFiltro !== "todos" || busca !== "";

  const handleSaveProjeto = async (input: NovoProjeto) => {
    const criado = await create(input);
    addLog({
      modulo: "Projetos",
      acao: "adição",
      descricao: `Novo projeto cadastrado: ${criado.nome}`,
      detalhe: `${criado.status} · ${criado.orcamentoTotal !== null ? fmt(criado.orcamentoTotal) : "sem orçamento"}`,
    });
  };

  return (
    <div className="space-y-5">
      {modal && <ModalNovoProjeto onClose={() => setModal(false)} onSave={handleSaveProjeto} />}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[var(--foreground)]">Projetos</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {filtrados.length} de {projetos.length} iniciativas
            {hasFilters && <button onClick={limparFiltros} className="ml-2 text-[#0e7e6e] hover:underline cursor-pointer">Limpar filtros</button>}
          </p>
        </div>
        <button onClick={() => setModal(true)} className="text-xs bg-[#1a3a6b] text-white rounded px-3 py-1.5 hover:bg-[#142e57] transition-colors cursor-pointer">
          + Novo Projeto
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? <LoadingState /> : (
        <>
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
          </div>

          {/* Cards */}
          {filtrados.length === 0 ? (
            <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center">
              <p className="text-[var(--muted-foreground)] text-sm">Nenhum projeto corresponde aos filtros selecionados.</p>
              <button onClick={limparFiltros}
                className="mt-3 text-xs text-[#0e7e6e] hover:underline cursor-pointer">Limpar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtrados.map((p) => {
                const orcamento = p.orcamentoTotal ?? 0;
                const realizado = realizadoPorProjeto.get(p.id) ?? 0;
                const pct = orcamento > 0 ? Math.round((realizado / orcamento) * 100) : 0;
                const cor = corDoProjeto(p.id);
                return (
                  <div key={p.id} className="bg-white rounded-lg border border-[var(--border)] p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                          <h2 className="font-semibold text-[var(--foreground)] truncate">{p.nome}</h2>
                        </div>
                        {p.descricao && <p className="text-xs text-[var(--muted-foreground)]">{p.descricao}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-3 ${statusColors[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] font-mono mb-4">
                      <span>Início {formatDate(p.dataInicio)}</span>
                      <span>·</span>
                      <span>Fim {formatDate(p.dataFim)}</span>
                      {p.dataInicio && p.dataFim && <>
                        <span>·</span>
                        <span>{formatDuracao(p.dataInicio, p.dataFim)}</span>
                      </>}
                    </div>

                    {orcamento > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[var(--muted-foreground)]">Execução orçamentária</span>
                          <span className="text-xs font-mono font-medium">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cor }} />
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs font-mono text-[var(--muted-foreground)]">
                          <span>{fmt(realizado)} realizado</span>
                          <span>{fmt(orcamento)} total</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
