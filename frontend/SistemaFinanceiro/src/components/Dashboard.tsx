import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmt } from '@/lib/format';

type PeriodoDash = 'semana' | 'mes' | 'trimestre' | 'ano' | 'personalizado';

const cashFlowData = [
  { mes: "Mar", realizado: 42000, previsto: 38000 },
  { mes: "Abr", realizado: 51000, previsto: 47000 },
  { mes: "Mai", realizado: 39000, previsto: 44000 },
  { mes: "Jun", realizado: 63000, previsto: 58000 },
  { mes: "Jul", realizado: 55000, previsto: 60000 },
  { mes: "Ago", realizado: 71000, previsto: 65000 },
];
const contasVencidas = [
  { descricao: "Convênio Secretaria de Educação", valor: 22000, vencimento: "10/08/2026", tipo: "receber" },
  { descricao: "Edital Cultura Viva — Prestação de Contas", valor: 9600, vencimento: "15/08/2026", tipo: "receber" },
  { descricao: "Fornecedor gráfico — impressão", valor: 1480, vencimento: "12/08/2026", tipo: "pagar" },
];

const contasVencendo = [
  { descricao: "Doação Fundação Banco do Brasil", valor: 35000, vencimento: "25/08/2026", tipo: "receber" },
  { descricao: "Seguro da sede", valor: 960, vencimento: "28/08/2026", tipo: "pagar" },
  { descricao: "Conta de energia", valor: 640, vencimento: "30/08/2026", tipo: "pagar" },
];
export function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-3">{label}</p>
      <p className={`text-2xl font-semibold ${color ?? "text-[var(--foreground)]"}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>}
    </div>
  );
}

// ── dados por período para o dashboard ───────────────────────────────────────
const dashPeriodoData: Record<PeriodoDash, {
  label: string; sublabel: string; entradas: number; saidas: number; saldoContas: number;
  subEntradas: string; subSaidas: string; chartData: typeof cashFlowData;
}> = {
  semana: {
    label: "Semana", sublabel: "18 a 22 de agosto de 2026",
    entradas: 32100, saidas: 18450, saldoContas: 184320,
    subEntradas: "+14% vs semana anterior", subSaidas: "3 lançamentos",
    chartData: cashFlowData.slice(-4),
  },
  mes: {
    label: "Mês", sublabel: "Agosto 2026",
    entradas: 54700, saidas: 18750, saldoContas: 184320,
    subEntradas: "+8% vs mês anterior", subSaidas: "12 lançamentos",
    chartData: cashFlowData.slice(-3),
  },
  trimestre: {
    label: "Trimestre", sublabel: "Jun a Ago 2026",
    entradas: 189000, saidas: 126000, saldoContas: 184320,
    subEntradas: "3 meses acumulado", subSaidas: "31 lançamentos",
    chartData: cashFlowData.slice(-3),
  },
  ano: {
    label: "Ano", sublabel: "Jan a Ago 2026",
    entradas: 321000, saidas: 220000, saldoContas: 184320,
    subEntradas: "8 meses acumulado", subSaidas: "87 lançamentos",
    chartData: cashFlowData,
  },
  personalizado: {
    label: "Personalizado", sublabel: "Período selecionado",
    entradas: 54700, saidas: 18750, saldoContas: 184320,
    subEntradas: "Período customizado", subSaidas: "—",
    chartData: cashFlowData.slice(-2),
  },
};

const periodoOpcoes: { key: PeriodoDash; label: string }[] = [
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
  { key: "trimestre", label: "Trimestre" },
  { key: "ano", label: "Este ano" },
  { key: "personalizado", label: "Personalizado" },
];

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
  const [periodo, setPeriodo] = useState<PeriodoDash>("semana");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const d = dashPeriodoData[periodo];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[var(--foreground)]">Painel de Controle</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{d.sublabel}</p>
        </div>
        <FiltroDropdown
          periodo={periodo} setPeriodo={setPeriodo}
          dataIni={dataIni} setDataIni={setDataIni}
          dataFim={dataFim} setDataFim={setDataFim}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label={`Entradas — ${d.label}`} value={fmt(d.entradas)} sub={d.subEntradas} color="text-[#0e7e6e]" />
        <SummaryCard label={`Saídas — ${d.label}`} value={fmt(d.saidas)} sub={d.subSaidas} color="text-red-600" />
        <SummaryCard label="Saldo do período" value={fmt(d.entradas - d.saidas)} sub={`Previsto: ${fmt(d.entradas * 0.9)}`} />
        <SummaryCard label="Saldo das contas" value={fmt(d.saldoContas)} sub="2 contas ativas" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-lg border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm text-[var(--foreground)]">Fluxo de Caixa</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Realizado vs. Previsto — {d.sublabel}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                formatter={(v: number) => fmt(v)}
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
              <span className="ml-auto text-xs font-mono bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{contasVencidas.length}</span>
            </div>
            <div className="space-y-2.5">
              {contasVencidas.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--foreground)] truncate">{c.descricao}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{c.vencimento}</p>
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
              <span className="ml-auto text-xs font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{contasVencendo.length}</span>
            </div>
            <div className="space-y-2.5">
              {contasVencendo.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--foreground)] truncate">{c.descricao}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{c.vencimento}</p>
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
    </div>
  );
}

// ── tipos e helpers de comprovantes ──────────────────────────────────────────
