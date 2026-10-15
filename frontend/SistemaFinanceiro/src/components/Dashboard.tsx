import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmt, formatDate } from '@/lib/format';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useContas } from '@/hooks/useContas';
import {
  getIntervaloPeriodo, resumoPeriodo, saldoTotalContas, contasPendentes, serieFluxoCaixa,
  type PeriodoDash,
} from '@/lib/aggregations';
import { LoadingState, ErrorState } from './StatusMessage';
import FiltroPeriodo, { formatIntervalo, labelPeriodo } from './FiltroPeriodo';

export function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-3">{label}</p>
      <p className={`text-2xl font-semibold ${color ?? "text-[var(--foreground)]"}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>}
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
        <FiltroPeriodo
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
