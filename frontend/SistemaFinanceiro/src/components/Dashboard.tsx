import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmt, formatDate } from '@/lib/format';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useContas } from '@/hooks/useContas';
import {
  getIntervaloPeriodo, resumoPeriodo, saldoTotalContas, contasPendentes, serieFluxoCaixa,
  type PeriodoDash, type Intervalo,
} from '@/lib/aggregations';
import { LoadingState, ErrorState } from './StatusMessage';

export function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-3">{label}</p>
      <p className={`text-2xl font-semibold ${color ?? "text-[var(--foreground)]"}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>}
    </div>
  );
}

const periodoOpcoes: { key: PeriodoDash; label: string }[] = [
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
  { key: "trimestre", label: "Trimestre" },
  { key: "ano", label: "Este ano" },
  { key: "personalizado", label: "Personalizado" },
];

function labelPeriodo(key: PeriodoDash): string {
  return periodoOpcoes.find((o) => o.key === key)?.label ?? key;
}

function formatIntervalo(periodo: PeriodoDash, intervalo: Intervalo): string {
  const completo = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  if (periodo === "mes") return completo.format(intervalo.inicio).replace(/^\d{2} de /, "");
  const curto = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${curto.format(intervalo.inicio)} a ${completo.format(intervalo.fim)}`;
}

function FiltroDropdown({ periodo, setPeriodo, dataIni, setDataIni, dataFim, setDataFim }: {
  periodo: PeriodoDash; setPeriodo: (p: PeriodoDash) => void;
  dataIni: string; setDataIni: (v: string) => void;
  dataFim: string; setDataFim: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = periodoOpcoes.find(o => o.key === periodo)!;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs border border-[var(--border)] rounded-md px-3 py-1.5 bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="font-medium text-[var(--foreground)]">{selected.label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[var(--muted-foreground)] transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[var(--border)] rounded-lg shadow-lg w-56 overflow-hidden">
            <div className="py-1">
              {periodoOpcoes.map(op => (
                <button
                  key={op.key}
                  onClick={() => { setPeriodo(op.key); if (op.key !== "personalizado") setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${periodo === op.key ? "bg-[#0f1e3d]/5 text-[#0f1e3d] font-medium" : "text-[var(--foreground)] hover:bg-[var(--muted)]"}`}
                >
                  {op.label}
                  {periodo === op.key && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
            {periodo === "personalizado" && (
              <div className="border-t border-[var(--border)] px-4 py-3 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Intervalo de datas</p>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">De</label>
                  <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-[var(--border)] rounded focus:outline-none focus:border-[#1a3a6b] font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">Até</label>
                  <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-[var(--border)] rounded focus:outline-none focus:border-[#1a3a6b] font-mono" />
                </div>
                <button onClick={() => setOpen(false)} className="w-full h-8 bg-[#0f1e3d] text-white text-xs rounded hover:bg-[#1a3060] transition-colors cursor-pointer mt-1">
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: lancamentos, loading: loadingLancamentos, error: errorLancamentos } = useLancamentos();
  const { data: contas, loading: loadingContas, error: errorContas } = useContas();
  const [periodo, setPeriodo] = useState<PeriodoDash>("semana");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");

  const loading = loadingLancamentos || loadingContas;
  const error = errorLancamentos ?? errorContas;

  const intervalo = useMemo(() => getIntervaloPeriodo(periodo, new Date(), dataIni, dataFim), [periodo, dataIni, dataFim]);
  const resumo = useMemo(() => resumoPeriodo(lancamentos, intervalo), [lancamentos, intervalo]);
  const { vencidas, vencendo } = useMemo(() => contasPendentes(lancamentos), [lancamentos]);
  const chartData = useMemo(() => serieFluxoCaixa(lancamentos), [lancamentos]);
  const saldoContas = useMemo(() => saldoTotalContas(contas), [contas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[var(--foreground)]">Painel de Controle</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{formatIntervalo(periodo, intervalo)}</p>
        </div>
        <FiltroDropdown
          periodo={periodo} setPeriodo={setPeriodo}
          dataIni={dataIni} setDataIni={setDataIni}
          dataFim={dataFim} setDataFim={setDataFim}
        />
      </div>

      {error && <ErrorState message={error} />}

      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <SummaryCard
              label={`Entradas — ${labelPeriodo(periodo)}`}
              value={fmt(resumo.entradas)}
              sub={`${resumo.qtdLancamentos} lançamento${resumo.qtdLancamentos === 1 ? "" : "s"} no período`}
              color="text-[#0e7e6e]"
            />
            <SummaryCard
              label={`Saídas — ${labelPeriodo(periodo)}`}
              value={fmt(resumo.saidas)}
              sub={`${resumo.qtdLancamentos} lançamento${resumo.qtdLancamentos === 1 ? "" : "s"} no período`}
              color="text-red-600"
            />
            <SummaryCard label="Saldo do período" value={fmt(resumo.entradas - resumo.saidas)} />
            <SummaryCard
              label="Saldo das contas"
              value={fmt(saldoContas)}
              sub={`${contas.length} conta${contas.length === 1 ? "" : "s"} cadastrada${contas.length === 1 ? "" : "s"}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-lg border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-sm text-[var(--foreground)]">Fluxo de Caixa</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">Realizado vs. Previsto — últimos 6 meses</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0e7e6e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0e7e6e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a3a6b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1a3a6b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => fmt(Number(v))}
                    contentStyle={{ fontSize: 12, border: "1px solid #d4dae7", borderRadius: 6, fontFamily: "Instrument Sans" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="realizado" name="Realizado" stroke="#0e7e6e" strokeWidth={2} fill="url(#colorRealizado)" dot={{ r: 3, fill: "#0e7e6e" }} />
                  <Area type="monotone" dataKey="previsto" name="Previsto" stroke="#1a3a6b" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#colorPrevisto)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-[var(--border)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className="text-sm font-semibold">Vencidas</h2>
                  <span className="ml-auto text-xs font-mono bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{vencidas.length}</span>
                </div>
                <div className="space-y-2.5">
                  {vencidas.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Nenhuma pendência vencida.</p>}
                  {vencidas.map((c, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate">{c.descricao}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{formatDate(c.vencimento)}</p>
                      </div>
                      <span className={`text-xs font-mono font-medium shrink-0 ${c.tipo === "receber" ? "text-[#0e7e6e]" : "text-red-600"}`}>
                        {c.tipo === "receber" ? "+" : "-"}{fmt(c.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[var(--border)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <h2 className="text-sm font-semibold">Vencendo em breve</h2>
                  <span className="ml-auto text-xs font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{vencendo.length}</span>
                </div>
                <div className="space-y-2.5">
                  {vencendo.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Nenhuma pendência nos próximos 7 dias.</p>}
                  {vencendo.map((c, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate">{c.descricao}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{formatDate(c.vencimento)}</p>
                      </div>
                      <span className={`text-xs font-mono font-medium shrink-0 ${c.tipo === "receber" ? "text-[#0e7e6e]" : "text-red-600"}`}>
                        {c.tipo === "receber" ? "+" : "-"}{fmt(c.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
