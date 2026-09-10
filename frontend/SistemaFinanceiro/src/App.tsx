import React, { useState } from "react";
import mdcaLogo from "@/imports/coisaaa.png";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type AuthScreen = "login" | "cadastro";
type Module = "inicio" | "financeiro" | "projetos" | "relatorios" | "cadastros";
type FinanceTab = "lancamentos" | "entradas" | "saidas" | "fluxo";
type PeriodoDash = "semana" | "mes" | "trimestre" | "ano" | "personalizado";

const cashFlowData = [
  { mes: "Mar", realizado: 42000, previsto: 38000 },
  { mes: "Abr", realizado: 51000, previsto: 47000 },
  { mes: "Mai", realizado: 39000, previsto: 44000 },
  { mes: "Jun", realizado: 63000, previsto: 58000 },
  { mes: "Jul", realizado: 55000, previsto: 60000 },
  { mes: "Ago", realizado: 71000, previsto: 65000 },
];

const lancamentos = [
  { data: "22/08/2026", descricao: "Convênio SEDES — Parcela 3", projeto: "Projeto Semear", conta: "C/C Bradesco", valor: 18500.0, tipo: "entrada", situacao: "Recebido" },
  { data: "21/08/2026", descricao: "Pagamento folha de pessoal", projeto: "Administrativo", conta: "C/C Bradesco", valor: -12400.0, tipo: "saida", situacao: "Pago" },
  { data: "20/08/2026", descricao: "Doação — Instituto Cidadania", projeto: "Projeto Raízes", conta: "C/C Itaú", valor: 5000.0, tipo: "entrada", situacao: "Recebido" },
  { data: "19/08/2026", descricao: "Aluguel sede", projeto: "Administrativo", conta: "C/C Bradesco", valor: -3200.0, tipo: "saida", situacao: "Pago" },
  { data: "18/08/2026", descricao: "Reembolso material didático", projeto: "Projeto Semear", conta: "C/C Itaú", valor: -870.0, tipo: "saida", situacao: "Pago" },
  { data: "15/08/2026", descricao: "Captação — Edital Cultura Viva", projeto: "Projeto Voz Ativa", conta: "C/C Bradesco", valor: 9600.0, tipo: "entrada", situacao: "Previsto" },
  { data: "14/08/2026", descricao: "Internet e telefonia", projeto: "Administrativo", conta: "C/C Itaú", valor: -480.0, tipo: "saida", situacao: "Pago" },
  { data: "10/08/2026", descricao: "Bolsa — Monitor educacional", projeto: "Projeto Semear", conta: "C/C Bradesco", valor: -1800.0, tipo: "saida", situacao: "Pago" },
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

const projetos = [
  { nome: "Projeto Semear", descricao: "Educação rural e capacitação agrícola sustentável", status: "Em andamento", inicio: "01/03/2026", inicioAno: 2026, inicioMes: 3, fim: "28/02/2027", fimAno: 2027, fimMes: 2, duracao: "12 meses", cor: "#0e7e6e", orcamento: 148000, realizado: 74200, tags: ["Educação", "Rural", "Conv. SEDES"] },
  { nome: "Projeto Raízes", descricao: "Fortalecimento de identidades culturais comunitárias", status: "Em andamento", inicio: "01/06/2026", inicioAno: 2026, inicioMes: 6, fim: "31/05/2027", fimAno: 2027, fimMes: 5, duracao: "12 meses", cor: "#1a3a6b", orcamento: 92000, realizado: 23500, tags: ["Cultura", "Comunidade"] },
  { nome: "Projeto Voz Ativa", descricao: "Comunicação e cidadania para jovens periféricos", status: "Planejamento", inicio: "01/10/2026", inicioAno: 2026, inicioMes: 10, fim: "30/09/2027", fimAno: 2027, fimMes: 9, duracao: "12 meses", cor: "#7c5fbd", orcamento: 76000, realizado: 0, tags: ["Juventude", "Comunicação", "Edital"] },
  { nome: "Rede Solidária", descricao: "Articulação de redes de economia solidária", status: "Concluído", inicio: "01/01/2025", inicioAno: 2025, inicioMes: 1, fim: "31/12/2025", fimAno: 2025, fimMes: 12, duracao: "12 meses", cor: "#6b7a99", orcamento: 110000, realizado: 108750, tags: ["Economia Solidária", "Articulação"] },
];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusColors: Record<string, string> = {
  "Em andamento": "bg-emerald-100 text-emerald-800",
  Planejamento: "bg-amber-100 text-amber-800",
  Concluído: "bg-slate-100 text-slate-600",
};

function NavBar({ active, setModule }: { active: Module; setModule: (m: Module) => void }) {
  const items: { key: Module; label: string }[] = [
    { key: "inicio", label: "Início" },
    { key: "financeiro", label: "Financeiro" },
    { key: "projetos", label: "Projetos" },
    { key: "relatorios", label: "Relatórios" },
    { key: "cadastros", label: "Cadastros" },
  ];
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
          <div className="w-7 h-7 rounded-full bg-[#0e7e6e]/30 flex items-center justify-center text-xs font-semibold text-[#0e7e6e]">
            MO
          </div>
        </div>
      </div>
    </header>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
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

function Dashboard() {
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

function Financeiro() {
  const [tab, setTab] = useState<FinanceTab>("lancamentos");
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

  return (
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
                  {["Data", "Descrição", "Projeto", "Conta", "Valor", "Situação"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
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
                  </tr>
                ))}
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
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const todasTags = Array.from(new Set(projetos.flatMap(p => p.tags)));
const anosDisponiveis = Array.from(new Set(projetos.flatMap(p => [p.inicioAno, p.fimAno]))).sort();

function Projetos() {
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

type RelatorioKey = "execucao" | "extrato" | "fluxo" | "balancete";

const relatoriosMeta: { key: RelatorioKey; label: string; sublabel: string }[] = [
  { key: "execucao", label: "Execução Orçamentária", sublabel: "Por projeto e categoria" },
  { key: "extrato", label: "Extrato Financeiro", sublabel: "Movimentações do período" },
  { key: "fluxo", label: "Fluxo de Caixa", sublabel: "Realizado vs. previsto" },
  { key: "balancete", label: "Balancete", sublabel: "Prestação de contas" },
];

const execucaoData = [
  { projeto: "Projeto Semear", fonte: "Conv. SEDES", orcado: 148000, realizado: 74200, categorias: [
    { nome: "Pessoal", orcado: 72000, realizado: 38400 },
    { nome: "Material didático", orcado: 28000, realizado: 16800 },
    { nome: "Transporte", orcado: 18000, realizado: 9200 },
    { nome: "Comunicação", orcado: 8000, realizado: 3100 },
    { nome: "Outros", orcado: 22000, realizado: 6700 },
  ]},
  { projeto: "Projeto Raízes", fonte: "Instituto Cidadania", orcado: 92000, realizado: 23500, categorias: [
    { nome: "Pessoal", orcado: 44000, realizado: 12000 },
    { nome: "Produção cultural", orcado: 26000, realizado: 8500 },
    { nome: "Equipamentos", orcado: 12000, realizado: 3000 },
    { nome: "Outros", orcado: 10000, realizado: 0 },
  ]},
  { projeto: "Projeto Voz Ativa", fonte: "Edital Cultura Viva", orcado: 76000, realizado: 0, categorias: [
    { nome: "Pessoal", orcado: 38000, realizado: 0 },
    { nome: "Comunicação", orcado: 20000, realizado: 0 },
    { nome: "Outros", orcado: 18000, realizado: 0 },
  ]},
];

const balanceteData = [
  { fonte: "Convênio SEDES", tipo: "Gov. Estadual", entradas: 74200, saidas: 68400, saldo: 5800 },
  { fonte: "Instituto Cidadania", tipo: "Privado", entradas: 23500, saidas: 20100, saldo: 3400 },
  { fonte: "Doações Livres", tipo: "Pessoa Física", entradas: 8200, saidas: 0, saldo: 8200 },
  { fonte: "Recursos Próprios", tipo: "Próprio", entradas: 4100, saidas: 3700, saldo: 400 },
];

function RelExecucao() {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Execução Orçamentária</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Agosto 2026 — por projeto e categoria</p>
        </div>
        <button className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar PDF
        </button>
      </div>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f1e3d] text-white">
              <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wide font-medium">Projeto / Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium">Fonte</th>
              <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium">Orçado</th>
              <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium">Realizado</th>
              <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium">Saldo</th>
              <th className="px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium w-36">Execução</th>
            </tr>
          </thead>
          <tbody>
            {execucaoData.map((p) => {
              const pct = Math.round((p.realizado / p.orcado) * 100);
              const isOpen = expanded === p.projeto;
              return (
                <React.Fragment key={p.projeto}>
                  <tr
                    className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    onClick={() => setExpanded(isOpen ? null : p.projeto)}
                  >
                    <td className="px-5 py-3 font-semibold text-[var(--foreground)] flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
                      {p.projeto}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{p.fonte}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{fmt(p.orcado)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#0e7e6e] font-medium">{fmt(p.realizado)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-xs font-medium ${(p.orcado - p.realizado) >= 0 ? "text-[var(--muted-foreground)]" : "text-red-600"}`}>{fmt(p.orcado - p.realizado)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                          <div className="h-full bg-[#0e7e6e] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono w-8 text-right text-[var(--muted-foreground)]">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                  {isOpen && p.categorias.map((cat) => {
                    const cp = cat.orcado > 0 ? Math.round((cat.realizado / cat.orcado) * 100) : 0;
                    return (
                      <tr key={cat.nome} className="border-t border-[var(--border)] bg-[#f8f9fc]">
                        <td className="px-5 py-2.5 text-xs text-[var(--muted-foreground)] pl-12">{cat.nome}</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-[var(--muted-foreground)]">{fmt(cat.orcado)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-[#0e7e6e]">{fmt(cat.realizado)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-[var(--muted-foreground)]">{fmt(cat.orcado - cat.realizado)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                              <div className="h-full bg-[#0e7e6e]/60 rounded-full" style={{ width: `${Math.min(cp, 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-mono w-8 text-right text-[var(--muted-foreground)]">{cp}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#0f1e3d]/20 bg-[#edf0f5]">
              <td colSpan={2} className="px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wide text-[var(--foreground)]">Total Geral</td>
              <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{fmt(execucaoData.reduce((a, b) => a + b.orcado, 0))}</td>
              <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-[#0e7e6e]">{fmt(execucaoData.reduce((a, b) => a + b.realizado, 0))}</td>
              <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{fmt(execucaoData.reduce((a, b) => a + b.orcado - b.realizado, 0))}</td>
              <td className="px-4 py-3">
                <span className="text-xs font-mono text-[var(--muted-foreground)]">
                  {Math.round(execucaoData.reduce((a,b)=>a+b.realizado,0)/execucaoData.reduce((a,b)=>a+b.orcado,0)*100)}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function RelExtrato() {
  const [filtro, setFiltro] = useState("");
  const [tipFiltro, setTipFiltro] = useState<"todos" | "entrada" | "saida">("todos");
  const filtered = lancamentos.filter((l) => {
    const matchTipo = tipFiltro === "todos" || l.tipo === tipFiltro;
    const matchTxt = filtro === "" || l.descricao.toLowerCase().includes(filtro.toLowerCase()) || l.projeto.toLowerCase().includes(filtro.toLowerCase());
    return matchTipo && matchTxt;
  });
  const totalE = filtered.filter(l=>l.tipo==="entrada").reduce((a,b)=>a+b.valor,0);
  const totalS = filtered.filter(l=>l.tipo==="saida").reduce((a,b)=>a+Math.abs(b.valor),0);
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Extrato Financeiro</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Agosto 2026 — todas as movimentações</p>
        </div>
        <button className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar
        </button>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Buscar descrição ou projeto…"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors"
          />
        </div>
        <div className="flex rounded-md border border-[var(--border)] overflow-hidden bg-white text-xs">
          {(["todos","entrada","saida"] as const).map((t) => (
            <button key={t} onClick={() => setTipFiltro(t)}
              className={`px-3 py-1.5 capitalize transition-colors cursor-pointer ${tipFiltro===t ? "bg-[#0f1e3d] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}>
              {t === "todos" ? "Todos" : t === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
              {["Data","Descrição","Projeto","Conta","Situação","Valor"].map(h => (
                <th key={h} className={`py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium ${h==="Valor"?"text-right px-5":"text-left px-4"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr key={i} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)] whitespace-nowrap">{l.data}</td>
                <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{l.descricao}</td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{l.projeto}</td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] whitespace-nowrap">{l.conta}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                    l.situacao==="Recebido"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":l.situacao==="Pago"?"bg-[#0f1e3d]/10 text-[#0f1e3d]":"bg-amber-100 text-amber-700"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${l.situacao==="Recebido"?"bg-[#0e7e6e]":l.situacao==="Pago"?"bg-[#0f1e3d]":"bg-amber-500"}`}/>
                    {l.situacao}
                  </span>
                </td>
                <td className={`px-5 py-3 text-right font-mono text-xs font-medium whitespace-nowrap ${l.valor>=0?"text-[#0e7e6e]":"text-red-600"}`}>
                  {l.valor>=0?"+":""}{fmt(l.valor)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#0f1e3d]/20 bg-[#edf0f5]">
              <td colSpan={4} className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{filtered.length} lançamentos</td>
              <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">Totais</td>
              <td className="px-5 py-3 text-right">
                <span className="text-xs font-mono text-[#0e7e6e] font-semibold">+{fmt(totalE)}</span>
                {totalS > 0 && <span className="text-xs font-mono text-red-600 font-semibold ml-3">-{fmt(totalS)}</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function RelFluxo() {
  const monthlyData = [
    { mes: "Mar", realizado: 42000, previsto: 38000, saidas_r: 29000, saidas_p: 31000 },
    { mes: "Abr", realizado: 51000, previsto: 47000, saidas_r: 34000, saidas_p: 36000 },
    { mes: "Mai", realizado: 39000, previsto: 44000, saidas_r: 31000, saidas_p: 28000 },
    { mes: "Jun", realizado: 63000, previsto: 58000, saidas_r: 42000, saidas_p: 44000 },
    { mes: "Jul", realizado: 55000, previsto: 60000, saidas_r: 38000, saidas_p: 40000 },
    { mes: "Ago", realizado: 71000, previsto: 65000, saidas_r: 46000, saidas_p: 48000 },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Fluxo de Caixa</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Mar–Ago 2026 — Realizado vs. Previsto</p>
        </div>
        <button className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors">
          Período ▾
        </button>
      </div>
      <div className="border border-[var(--border)] rounded-lg p-5 bg-white mb-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="flxE" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0e7e6e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0e7e6e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="flxS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e05555" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#e05555" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${v/1000}k`} tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, border: "1px solid #d4dae7", borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="realizado" name="Entradas realizadas" stroke="#0e7e6e" strokeWidth={2} fill="url(#flxE)" dot={{ r: 3, fill: "#0e7e6e" }} />
            <Area type="monotone" dataKey="previsto" name="Entradas previstas" stroke="#0e7e6e" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
            <Area type="monotone" dataKey="saidas_r" name="Saídas realizadas" stroke="#e05555" strokeWidth={2} fill="url(#flxS)" dot={{ r: 3, fill: "#e05555" }} />
            <Area type="monotone" dataKey="saidas_p" name="Saídas previstas" stroke="#e05555" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total entradas realizadas", value: fmt(321000), color: "text-[#0e7e6e]" },
          { label: "Total saídas realizadas", value: fmt(220000), color: "text-red-600" },
          { label: "Resultado do período", value: fmt(101000), color: "text-[var(--foreground)]" },
        ].map((c) => (
          <div key={c.label} className="border border-[var(--border)] rounded-lg p-4 bg-white">
            <p className="text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">{c.label}</p>
            <p className={`text-xl font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelBalancete() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Balancete de Prestação de Contas</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Agosto 2026 — por fonte de recursos</p>
        </div>
        <button className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar PDF
        </button>
      </div>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f1e3d] text-white">
              {["Fonte de Recursos","Tipo","Entradas","Saídas","Saldo"].map(h => (
                <th key={h} className={`py-3 text-xs font-mono uppercase tracking-wide font-medium ${h==="Fonte de Recursos"||h==="Tipo"?"text-left px-5":"text-right px-5"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {balanceteData.map((r, i) => (
              <tr key={i} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{r.fonte}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] font-mono">{r.tipo}</span>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-xs text-[#0e7e6e] font-medium">{fmt(r.entradas)}</td>
                <td className="px-5 py-3.5 text-right font-mono text-xs text-red-600 font-medium">{r.saidas > 0 ? fmt(r.saidas) : "—"}</td>
                <td className={`px-5 py-3.5 text-right font-mono text-xs font-semibold ${r.saldo >= 0 ? "text-[#0e7e6e]" : "text-red-600"}`}>{fmt(r.saldo)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#0f1e3d]/20 bg-[#edf0f5]">
              <td colSpan={2} className="px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wide">Total</td>
              <td className="px-5 py-3 text-right font-mono text-xs font-semibold text-[#0e7e6e]">{fmt(balanceteData.reduce((a,b)=>a+b.entradas,0))}</td>
              <td className="px-5 py-3 text-right font-mono text-xs font-semibold text-red-600">{fmt(balanceteData.reduce((a,b)=>a+b.saidas,0))}</td>
              <td className="px-5 py-3 text-right font-mono text-xs font-semibold text-[#0e7e6e]">{fmt(balanceteData.reduce((a,b)=>a+b.saldo,0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="border border-[#0e7e6e]/20 bg-[#0e7e6e]/5 rounded-lg px-5 py-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
        <strong className="text-[#0e7e6e] font-mono uppercase tracking-wide text-[10px]">Nota de conformidade</strong><br />
        Este balancete foi gerado automaticamente com base nos lançamentos do período. Confira com o contador responsável antes de encaminhar aos órgãos financiadores.
      </div>
    </div>
  );
}

function Relatorios() {
  const [rel, setRel] = useState<RelatorioKey>("execucao");
  return (
    <div className="flex gap-0 min-h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-white rounded-l-lg">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Relatórios</p>
        </div>
        <nav className="py-2">
          {relatoriosMeta.map((r) => (
            <button
              key={r.key}
              onClick={() => setRel(r.key)}
              className={`w-full text-left px-5 py-3 transition-colors cursor-pointer border-l-2 ${
                rel === r.key
                  ? "border-[#0e7e6e] bg-[#0e7e6e]/5"
                  : "border-transparent hover:bg-[var(--muted)]"
              }`}
            >
              <p className={`text-sm font-medium ${rel === r.key ? "text-[#0e7e6e]" : "text-[var(--foreground)]"}`}>{r.label}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{r.sublabel}</p>
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-[var(--border)] mt-auto">
          <p className="text-[10px] font-mono text-[var(--muted-foreground)] leading-relaxed">Período atual:<br /><strong className="text-[var(--foreground)]">Ago 2026</strong></p>
        </div>
      </aside>
      {/* Content */}
      <div className="flex-1 bg-white rounded-r-lg border border-[var(--border)] border-l-0 p-6 overflow-y-auto">
        {rel === "execucao" && <RelExecucao />}
        {rel === "extrato" && <RelExtrato />}
        {rel === "fluxo" && <RelFluxo />}
        {rel === "balancete" && <RelBalancete />}
      </div>
    </div>
  );
}

// ─── Cadastros ────────────────────────────────────────────────────────────────

type CadastroKey = "contatos" | "contas" | "fontes" | "categorias";

const cadastrosMeta: { key: CadastroKey; label: string; sublabel: string }[] = [
  { key: "contatos", label: "Contatos", sublabel: "Parceiros e financiadores" },
  { key: "contas", label: "Contas Financeiras", sublabel: "Bancos e caixas" },
  { key: "fontes", label: "Fontes de Recursos", sublabel: "Origens dos recursos" },
  { key: "categorias", label: "Categorias", sublabel: "Plano de contas" },
];

const contatosData = [
  { nome: "Instituto Cidadania", tipo: "Financiador", cnpj: "12.345.678/0001-90", email: "contato@institutocidadania.org.br", telefone: "(61) 3333-1234", status: "Ativo" },
  { nome: "Secretaria de Educação — DF", tipo: "Gov. Distrital", cnpj: "00.394.502/0001-44", email: "convenios@se.df.gov.br", telefone: "(61) 3901-5555", status: "Ativo" },
  { nome: "Fundação Banco do Brasil", tipo: "Financiador", cnpj: "28.541.667/0001-53", email: "projetos@fbb.org.br", telefone: "(61) 3108-2100", status: "Ativo" },
  { nome: "Gráfica Novo Horizonte", tipo: "Fornecedor", cnpj: "45.678.912/0001-23", email: "comercial@graficanovohorizonte.com.br", telefone: "(61) 3222-8899", status: "Ativo" },
  { nome: "Maria José Santos", tipo: "Beneficiária", cnpj: "—", email: "mariajose@gmail.com", telefone: "(61) 98765-4321", status: "Ativo" },
  { nome: "Consultoria AdmONG", tipo: "Fornecedor", cnpj: "67.890.123/0001-45", email: "financeiro@admong.com.br", telefone: "(61) 3111-2233", status: "Inativo" },
];

const contasData = [
  { nome: "C/C Bradesco", banco: "Bradesco", agencia: "1234-5", conta: "12345-6", tipo: "Conta Corrente", saldo: 121440, status: "Ativa" },
  { nome: "C/C Itaú", banco: "Itaú", agencia: "0567-8", conta: "98765-4", tipo: "Conta Corrente", saldo: 62880, status: "Ativa" },
  { nome: "Caixa Pequenas Despesas", banco: "—", agencia: "—", conta: "—", tipo: "Caixa Interno", saldo: 1200, status: "Ativa" },
];

const fontesData = [
  { nome: "Convênio SEDES", origem: "Gov. Estadual", tipo: "Convênio", vigencia: "Mar 2026 – Fev 2027", valor: 148000, status: "Vigente" },
  { nome: "Instituto Cidadania", origem: "Privado", tipo: "Doação", vigencia: "Jun 2026 – Mai 2027", valor: 92000, status: "Vigente" },
  { nome: "Edital Cultura Viva", origem: "Gov. Federal", tipo: "Edital", vigencia: "Out 2026 – Set 2027", valor: 76000, status: "Aguardando" },
  { nome: "Recursos Próprios", origem: "Interno", tipo: "Recurso Próprio", vigencia: "Contínuo", valor: 0, status: "Vigente" },
];

const categoriasData = [
  { codigo: "1.0", nome: "Receitas", tipo: "Receita", subcategorias: ["1.1 Convênios e contratos", "1.2 Doações institucionais", "1.3 Doações pessoas físicas", "1.4 Rendimentos financeiros"] },
  { codigo: "2.0", nome: "Pessoal e Encargos", tipo: "Despesa", subcategorias: ["2.1 Salários", "2.2 Encargos sociais", "2.3 Bolsas educacionais"] },
  { codigo: "3.0", nome: "Custeio Operacional", tipo: "Despesa", subcategorias: ["3.1 Aluguel", "3.2 Energia e água", "3.3 Internet e telefonia", "3.4 Material de escritório"] },
  { codigo: "4.0", nome: "Projetos e Programas", tipo: "Despesa", subcategorias: ["4.1 Material didático", "4.2 Transporte", "4.3 Produção de eventos", "4.4 Contratação de serviços"] },
];

// ── shared modal shell ────────────────────────────────────────────────────────
const selectCls = "w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all appearance-none";
const inputMdCls = "w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all";
const chevronBg = { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat" as const, backgroundPosition: "right 12px center" };

function FieldMd({ label, required: req, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, onSubmit, submitLabel, children }: {
  title: string; subtitle: string; onClose: () => void;
  onSubmit: (e: React.FormEvent) => void; submitLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0f1e3d]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {children}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="flex-1 h-10 rounded-md bg-[#0f1e3d] text-white text-sm font-semibold hover:bg-[#1a3060] transition-colors cursor-pointer">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Novo Contato ────────────────────────────────────────────────────────
const tiposContato = ["Financiador", "Gov. Federal", "Gov. Estadual", "Gov. Distrital", "Gov. Municipal", "Fornecedor", "Parceiro", "Beneficiário", "Outro"];
const ufsLista = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

function ModalNovoContato({ onClose, onSave }: { onClose: () => void; onSave: (c: typeof contatosData[0]) => void }) {
  const [form, setForm] = useState({ nome: "", tipo: "", cnpj: "", email: "", telefone: "", endereco: "", municipio: "", uf: "", cep: "", responsavel: "", status: "Ativo" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nome: form.nome, tipo: form.tipo, cnpj: form.cnpj || "—", email: form.email, telefone: form.telefone, status: form.status });
    onClose();
  };

  return (
    <ModalShell title="Novo contato" subtitle="Parceiro, financiador, fornecedor ou beneficiário" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar contato">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldMd label="Nome / razão social" required>
            <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Instituto Esperança" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Tipo de contato" required>
          <select required value={form.tipo} onChange={set("tipo")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {tiposContato.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Status">
          <select value={form.status} onChange={set("status")} className={selectCls} style={chevronBg}>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </FieldMd>
        <FieldMd label="CNPJ">
          <input type="text" value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <FieldMd label="Telefone">
          <input type="text" value={form.telefone} onChange={set("telefone")} placeholder="(00) 00000-0000" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="E-mail" required>
            <input type="email" required value={form.email} onChange={set("email")} placeholder="contato@organizacao.org.br" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Responsável / pessoa de contato">
          <input type="text" value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do responsável" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="CEP">
          <input type="text" value={form.cep} onChange={set("cep")} placeholder="00000-000" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Endereço">
            <input type="text" value={form.endereco} onChange={set("endereco")} placeholder="Rua, número, complemento" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Município">
          <input type="text" value={form.municipio} onChange={set("municipio")} placeholder="Brasília" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="UF">
          <select value={form.uf} onChange={set("uf")} className={selectCls} style={chevronBg}>
            <option value="">—</option>
            {ufsLista.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </FieldMd>
      </div>
    </ModalShell>
  );
}

function CadContatos() {
  const [lista, setLista] = useState(contatosData);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = lista.filter(c => search === "" || c.nome.toLowerCase().includes(search.toLowerCase()) || c.tipo.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {modal && <ModalNovoContato onClose={() => setModal(false)} onSave={c => setLista(prev => [...prev, c])} />}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Contatos</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{lista.length} registros cadastrados</p>
          </div>
          <button onClick={() => setModal(true)} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo contato
          </button>
        </div>
        <div className="relative mb-4 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Buscar contato…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors" />
        </div>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                {["Nome","Tipo","CNPJ / CPF","E-mail","Telefone","Status",""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors group">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{c.nome}</td>
                  <td className="px-4 py-3"><span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{c.tipo}</span></td>
                  <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{c.cnpj}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{c.email}</td>
                  <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{c.telefone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.status==="Ativo"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs text-[#1a3a6b] hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const bancosList = [
  "Banco do Brasil", "Bradesco", "Caixa Econômica Federal", "Itaú", "Santander",
  "Sicredi", "Sicoob", "Nubank", "Inter", "BTG Pactual", "Safra", "BRB", "Outro",
];

const tipoContaList = [
  "Conta Corrente", "Conta Poupança", "Conta de Investimento", "Caixa Interno", "Fundo de Aplicação",
];

function ModalNovaConta({ onClose, onSave }: { onClose: () => void; onSave: (c: typeof contasData[0]) => void }) {
  const [form, setForm] = useState({ nome: "", tipo: "", banco: "", agencia: "", conta: "", saldo: "" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const isCaixa = form.tipo === "Caixa Interno";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome: form.nome || (isCaixa ? "Caixa Interno" : `${form.tipo} ${form.banco}`),
      banco: isCaixa ? "—" : form.banco,
      agencia: isCaixa ? "—" : form.agencia,
      conta: isCaixa ? "—" : form.conta,
      tipo: form.tipo,
      saldo: parseFloat(form.saldo.replace(",", ".")) || 0,
      status: "Ativa",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0f1e3d]/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Nova conta financeira</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Preencha os dados da conta para cadastrá-la</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Tipo de conta */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
              Tipo de conta <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={form.tipo}
              onChange={set("tipo")}
              className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="">Selecionar…</option>
              {tipoContaList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Banco — oculto para Caixa Interno */}
          {!isCaixa && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                Banco relacionado <span className="text-red-400">*</span>
              </label>
              <select
                required={!isCaixa}
                value={form.banco}
                onChange={set("banco")}
                className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
              >
                <option value="">Selecionar…</option>
                {bancosList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {/* Agência e Conta — lado a lado, ocultos para Caixa Interno */}
          {!isCaixa && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                  Agência <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required={!isCaixa}
                  value={form.agencia}
                  onChange={set("agencia")}
                  placeholder="0001-2"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                  Número da conta <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required={!isCaixa}
                  value={form.conta}
                  onChange={set("conta")}
                  placeholder="12345-6"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* Nome de identificação */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
              Nome de identificação
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={set("nome")}
              placeholder={isCaixa ? "Ex: Caixa da sede" : "Ex: C/C Bradesco principal"}
              className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
            />
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Deixe em branco para usar o nome automático.</p>
          </div>

          {/* Saldo inicial */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
              Saldo inicial (R$) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] font-mono select-none">R$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.saldo}
                onChange={set("saldo")}
                placeholder="0,00"
                className="w-full h-10 pl-10 pr-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-md bg-[#0f1e3d] text-white text-sm font-semibold hover:bg-[#1a3060] transition-colors cursor-pointer"
            >
              Salvar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CadContas() {
  const [lista, setLista] = useState(contasData);
  const [modalAberto, setModalAberto] = useState(false);

  const handleSave = (nova: typeof contasData[0]) => {
    setLista((prev) => [...prev, nova]);
  };

  return (
    <>
      {modalAberto && (
        <ModalNovaConta onClose={() => setModalAberto(false)} onSave={handleSave} />
      )}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Contas Financeiras</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Saldo consolidado: {fmt(lista.reduce((a,b)=>a+b.saldo,0))}</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova conta
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {lista.map((c, i) => (
            <div key={i} className="border border-[var(--border)] rounded-lg bg-white p-5 flex items-center justify-between group hover:border-[#1a3a6b]/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0f1e3d]/5 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f1e3d" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{c.nome}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{c.banco !== "—" ? `${c.banco} · Ag. ${c.agencia} · C/C ${c.conta}` : c.tipo}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)]">Saldo atual</p>
                  <p className="text-lg font-semibold text-[#0e7e6e] font-mono">{fmt(c.saldo)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.status==="Ativa"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{c.status}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-[var(--border)] rounded px-2.5 py-1 hover:bg-[var(--muted)]">Editar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Modal Nova Fonte de Recursos ──────────────────────────────────────────────
const tiposFonte = ["Convênio", "Contrato", "Edital", "Doação", "Recurso Próprio", "Subvenção", "Patrocínio", "Outro"];
const origensLista = ["Gov. Federal", "Gov. Estadual", "Gov. Distrital", "Gov. Municipal", "Privado", "Internacional", "Pessoa Física", "Interno"];

function ModalNovaFonte({ onClose, onSave }: { onClose: () => void; onSave: (f: typeof fontesData[0]) => void }) {
  const [form, setForm] = useState({ nome: "", tipo: "", origem: "", numero: "", objeto: "", vigIni: "", vigFim: "", valor: "", status: "Vigente" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vigencia = form.vigIni && form.vigFim ? `${form.vigIni} – ${form.vigFim}` : form.vigIni || "Contínuo";
    onSave({ nome: form.nome, tipo: form.tipo, origem: form.origem, vigencia, valor: parseFloat(form.valor.replace(",",".")) || 0, status: form.status });
    onClose();
  };

  return (
    <ModalShell title="Nova fonte de recursos" subtitle="Registre a origem e condições do recurso" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar fonte">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldMd label="Nome da fonte / programa" required>
            <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Convênio SEDES — Educação Rural" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Tipo de fonte" required>
          <select required value={form.tipo} onChange={set("tipo")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {tiposFonte.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Origem dos recursos" required>
          <select required value={form.origem} onChange={set("origem")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {origensLista.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Número do instrumento (convênio, contrato, edital…)">
            <input type="text" value={form.numero} onChange={set("numero")} placeholder="Ex: 001/2026 — SEDES/DF" className={inputMdCls + " font-mono"} />
          </FieldMd>
        </div>
        <FieldMd label="Início da vigência">
          <input type="text" value={form.vigIni} onChange={set("vigIni")} placeholder="Mar 2026" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="Fim da vigência">
          <input type="text" value={form.vigFim} onChange={set("vigFim")} placeholder="Fev 2027" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="Valor total (R$)" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] font-mono select-none">R$</span>
            <input type="number" required min="0" step="0.01" value={form.valor} onChange={set("valor")} placeholder="0,00" className={inputMdCls + " pl-10 font-mono"} />
          </div>
        </FieldMd>
        <FieldMd label="Status">
          <select value={form.status} onChange={set("status")} className={selectCls} style={chevronBg}>
            <option value="Vigente">Vigente</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Encerrado">Encerrado</option>
          </select>
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Objeto / descrição resumida">
            <textarea value={form.objeto} onChange={set("objeto")} rows={2} placeholder="Descreva brevemente o objeto do convênio ou programa…"
              className={inputMdCls + " h-auto py-2 resize-none"} />
          </FieldMd>
        </div>
      </div>
    </ModalShell>
  );
}

function CadFontes() {
  const [lista, setLista] = useState(fontesData);
  const [modal, setModal] = useState(false);

  return (
    <>
      {modal && <ModalNovaFonte onClose={() => setModal(false)} onSave={f => setLista(prev => [...prev, f])} />}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Fontes de Recursos</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{lista.length} fontes registradas</p>
          </div>
          <button onClick={() => setModal(true)} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova fonte
          </button>
        </div>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                {["Fonte","Origem","Tipo","Vigência","Valor total","Status",""].map(h => (
                  <th key={h} className="py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium text-left px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((f, i) => (
                <tr key={i} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors group">
                  <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{f.nome}</td>
                  <td className="px-4 py-3.5 text-xs text-[var(--muted-foreground)]">{f.origem}</td>
                  <td className="px-4 py-3.5"><span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{f.tipo}</span></td>
                  <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted-foreground)]">{f.vigencia}</td>
                  <td className="px-4 py-3.5 text-xs font-mono font-medium">{f.valor > 0 ? fmt(f.valor) : "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      f.status==="Vigente"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":
                      f.status==="Aguardando"?"bg-amber-100 text-amber-700":"bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs text-[#1a3a6b] hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Modal Nova Categoria ──────────────────────────────────────────────────────
function ModalNovaCategoria({ onClose, onSave, categoriasPai }: {
  onClose: () => void;
  onSave: (cat: { codigo: string; nome: string; tipo: string; subcategorias: string[] }) => void;
  categoriasPai: { codigo: string; nome: string }[];
}) {
  const [form, setForm] = useState({ nome: "", tipo: "Despesa", codigo: "", descricao: "", pai: "" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));
  const isSub = form.pai !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSub) {
      onSave({ codigo: form.pai, nome: "", tipo: "", subcategorias: [form.nome] });
    } else {
      onSave({ codigo: form.codigo || `${categoriasPai.length + 1}.0`, nome: form.nome, tipo: form.tipo, subcategorias: [] });
    }
    onClose();
  };

  return (
    <ModalShell title="Nova categoria" subtitle="Categoria principal ou subcategoria do plano de contas" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar categoria">
      <div className="space-y-4">
        {/* Tipo de entrada: principal ou subcategoria */}
        <div className="grid grid-cols-2 gap-2">
          {(["principal", "subcategoria"] as const).map(opt => {
            const ativo = isSub ? opt === "subcategoria" : opt === "principal";
            return (
              <button key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, pai: opt === "subcategoria" ? (categoriasPai[0]?.codigo ?? "") : "" }))}
                className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${ativo ? "border-[#0f1e3d] bg-[#0f1e3d]/5" : "border-[var(--border)] hover:bg-[var(--muted)]"}`}
              >
                <span className={`text-xs font-semibold ${ativo ? "text-[#0f1e3d]" : "text-[var(--muted-foreground)]"}`}>
                  {opt === "principal" ? "Categoria principal" : "Subcategoria"}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {opt === "principal" ? "Ex: Pessoal e Encargos" : "Ex: Salários, Bolsas…"}
                </span>
              </button>
            );
          })}
        </div>

        {isSub ? (
          <>
            <FieldMd label="Categoria pai" required>
              <select required value={form.pai} onChange={set("pai")} className={selectCls} style={chevronBg}>
                {categoriasPai.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
              </select>
            </FieldMd>
            <FieldMd label="Nome da subcategoria" required>
              <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Salários, Bolsas educacionais…" className={inputMdCls} />
            </FieldMd>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <FieldMd label="Código">
                <input type="text" value={form.codigo} onChange={set("codigo")} placeholder={`${categoriasPai.length + 1}.0`} className={inputMdCls + " font-mono"} />
              </FieldMd>
              <div className="col-span-2">
                <FieldMd label="Nome da categoria" required>
                  <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Custeio Operacional" className={inputMdCls} />
                </FieldMd>
              </div>
            </div>
            <FieldMd label="Tipo" required>
              <div className="grid grid-cols-2 gap-2">
                {(["Receita", "Despesa"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: t }))}
                    className={`h-10 rounded-md border text-sm font-medium transition-all cursor-pointer ${form.tipo === t
                      ? t === "Receita" ? "border-[#0e7e6e] bg-[#0e7e6e]/10 text-[#0e7e6e]" : "border-[#0f1e3d] bg-[#0f1e3d]/10 text-[#0f1e3d]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FieldMd>
            <FieldMd label="Descrição / observação">
              <textarea value={form.descricao} onChange={set("descricao")} rows={2} placeholder="Descreva brevemente o escopo desta categoria…"
                className={inputMdCls + " h-auto py-2 resize-none"} />
            </FieldMd>
          </>
        )}
      </div>
    </ModalShell>
  );
}

function CadCategorias() {
  const [lista, setLista] = useState(categoriasData);
  const [expanded, setExpanded] = useState<string | null>("1.0");
  const [modal, setModal] = useState(false);

  const handleSave = (input: { codigo: string; nome: string; tipo: string; subcategorias: string[] }) => {
    if (input.nome === "" && input.subcategorias.length > 0) {
      // é subcategoria — adicionar à categoria pai
      setLista(prev => prev.map(c => c.codigo === input.codigo ? { ...c, subcategorias: [...c.subcategorias, input.subcategorias[0]] } : c));
      setExpanded(input.codigo);
    } else {
      setLista(prev => [...prev, input]);
    }
  };

  return (
    <>
      {modal && (
        <ModalNovaCategoria
          onClose={() => setModal(false)}
          onSave={handleSave}
          categoriasPai={lista.map(c => ({ codigo: c.codigo, nome: c.nome }))}
        />
      )}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Categorias Financeiras</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Plano de contas da organização</p>
          </div>
          <button onClick={() => setModal(true)} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova categoria
          </button>
        </div>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          {lista.map((cat, i) => {
            const isOpen = expanded === cat.codigo;
            return (
              <div key={cat.codigo} className={i > 0 ? "border-t border-[var(--border)]" : ""}>
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.codigo)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-[var(--muted-foreground)] w-8">{cat.codigo}</span>
                    <span className="font-semibold text-[var(--foreground)] text-sm">{cat.nome}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wide ${cat.tipo==="Receita"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[#0f1e3d]/10 text-[#0f1e3d]"}`}>{cat.tipo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted-foreground)]">{cat.subcategorias.length} subcategorias</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border)] bg-[#f8f9fc]">
                    {cat.subcategorias.map((sub) => (
                      <div key={sub} className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] last:border-0 group hover:bg-[var(--muted)] transition-colors">
                        <div className="flex items-center gap-3 pl-8">
                          <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]" />
                          <span className="text-sm text-[var(--muted-foreground)]">{sub}</span>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#1a3a6b] hover:underline">Editar</button>
                      </div>
                    ))}
                    <div className="px-5 py-3 pl-16">
                      <button onClick={() => setModal(true)} className="text-xs text-[#0e7e6e] hover:underline flex items-center gap-1 cursor-pointer">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Adicionar subcategoria
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Cadastros() {
  const [cad, setCad] = useState<CadastroKey>("contatos");
  return (
    <div className="flex gap-0 min-h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-white rounded-l-lg">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Cadastros</p>
        </div>
        <nav className="py-2">
          {cadastrosMeta.map((c) => (
            <button
              key={c.key}
              onClick={() => setCad(c.key)}
              className={`w-full text-left px-5 py-3 transition-colors cursor-pointer border-l-2 ${
                cad === c.key
                  ? "border-[#0f1e3d] bg-[#0f1e3d]/5"
                  : "border-transparent hover:bg-[var(--muted)]"
              }`}
            >
              <p className={`text-sm font-medium ${cad === c.key ? "text-[#0f1e3d]" : "text-[var(--foreground)]"}`}>{c.label}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{c.sublabel}</p>
            </button>
          ))}
        </nav>
      </aside>
      {/* Content */}
      <div className="flex-1 bg-white rounded-r-lg border border-[var(--border)] border-l-0 p-6 overflow-y-auto">
        {cad === "contatos" && <CadContatos />}
        {cad === "contas" && <CadContas />}
        {cad === "fontes" && <CadFontes />}
        {cad === "categorias" && <CadCategorias />}
      </div>
    </div>
  );
}

// ─── Logo mark ───────────────────────────────────────────────────────────────
function BussolaLogo({ size = 28, light = false }: { size?: number; light?: boolean }) {
  return (
    <img
      src={mdcaLogo}
      alt="MDCA"
      width={size}
      height={size}
      className="rounded-full object-contain"
      style={{ background: light ? "rgba(255,255,255,0.15)" : "#fff" }}
    />
  );
}

// ─── Auth screens ─────────────────────────────────────────────────────────────
function AuthBrand() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#0f1e3d] text-white p-12 relative overflow-hidden">
      {/* decorative rings */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-white/5" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/8" />
      <div className="absolute top-1/3 right-0 w-48 h-48 rounded-full border border-[#0e7e6e]/20" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-14">
          <BussolaLogo size={32} light />
          <div>
            <span className="font-serif text-xl leading-none tracking-tight block">Financeiro MDCA</span>
            <span className="text-[10px] text-[#0e7e6e] font-mono uppercase tracking-[0.2em] block mt-0.5">Sistema</span>
          </div>
        </div>

        <h2 className="font-serif text-4xl leading-[1.15] mb-5">
          Sistema Financeiro<br />
          <em>MDCA</em>
        </h2>
        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
          Controle projetos, convênios e fluxo de caixa da sua ONG com clareza e segurança — do lançamento à prestação de contas.
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        {[
          { icon: "◆", text: "Controle de projetos e fontes de recursos" },
          { icon: "◆", text: "Fluxo de caixa e conciliação bancária" },
          { icon: "◆", text: "Relatórios para prestação de contas" },
        ].map((item) => (
          <div key={item.text} className="flex items-start gap-3">
            <span className="text-[#0e7e6e] text-[8px] mt-1">{item.icon}</span>
            <span className="text-white/70 text-xs">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Sistema = "financeiro" | "gestao";

const sistemasConfig: Record<Sistema, { label: string; sublabel: string; desc: string; accent: string; accentDim: string; ring: string }> = {
  financeiro: {
    label: "Sistema Financeiro MDCA",
    sublabel: "FINANCEIRO",
    desc: "Lançamentos, fluxo de caixa e prestação de contas",
    accent: "#0e7e6e",
    accentDim: "#0e7e6e1a",
    ring: "focus:ring-[#0e7e6e]/30 focus:border-[#0e7e6e]",
  },
  gestao: {
    label: "Sistema Gestão MDCA",
    sublabel: "GESTÃO",
    desc: "Projetos, equipes, metas e monitoramento de impacto",
    accent: "#1a3a6b",
    accentDim: "#1a3a6b1a",
    ring: "focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b]",
  },
};

function SistemaSelector({ value, onChange }: { value: Sistema; onChange: (s: Sistema) => void }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-2">Acessar sistema</p>
      <div className="grid grid-cols-2 gap-2">
        {(["financeiro", "gestao"] as Sistema[]).map((s) => {
          const cfg = sistemasConfig[s];
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={`relative flex flex-col items-start gap-1 px-4 py-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                active
                  ? "border-current bg-white shadow-sm"
                  : "border-[#d4dae7] bg-white/60 hover:bg-white hover:border-[#b0bac9]"
              }`}
              style={active ? { borderColor: cfg.accent, color: cfg.accent } : {}}
            >
              {active && (
                <span
                  className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: cfg.accent }}
                />
              )}
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] font-semibold" style={active ? { color: cfg.accent } : { color: "#6b7a99" }}>
                {cfg.sublabel}
              </span>
              <span className="text-xs font-semibold text-[#0f1e3d] leading-snug">{cfg.label}</span>
              <span className="text-[10px] text-[#6b7a99] leading-snug">{cfg.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, goToCadastro }: { onLogin: () => void; goToCadastro: () => void }) {
  const [sistema, setSistema] = useState<Sistema>("financeiro");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const cfg = sistemasConfig[sistema];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 900);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[480px_1fr] bg-white">
      <AuthBrand />
      <div className="flex items-center justify-center px-8 py-12 bg-[#f4f6f9]">
        <div className="w-full max-w-sm">
          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <BussolaLogo size={24} />
            <span className="font-serif text-xl text-[#0f1e3d]">Financeiro MDCA</span>
            <span className="text-[10px] text-[#0e7e6e] font-mono uppercase tracking-widest">Sistema</span>
          </div>

          <h1 className="font-serif text-3xl text-[#0f1e3d] mb-1">Entrar</h1>
          <p className="text-sm text-[#6b7a99] mb-6">Selecione o sistema e acesse sua conta</p>

          <SistemaSelector value={sistema} onChange={setSistema} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-1.5">
                E-mail profissional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@organizacao.org.br"
                className={`w-full h-11 px-4 rounded-md border border-[#d4dae7] bg-white text-sm text-[#0f1e3d] placeholder-[#b0bac9] focus:outline-none focus:ring-2 transition-all ${cfg.ring}`}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 px-4 pr-11 rounded-md border border-[#d4dae7] bg-white text-sm text-[#0f1e3d] placeholder-[#b0bac9] focus:outline-none focus:ring-2 transition-all ${cfg.ring}`}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a99] hover:text-[#0f1e3d] transition-colors cursor-pointer"
                >
                  {showSenha ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  className="text-xs transition-colors cursor-pointer"
                  style={{ color: cfg.accent }}
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ background: cfg.accent }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando…
                </>
              ) : `Entrar no ${cfg.label}`}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

function CadastroScreen({ onLogin, goToLogin }: { onLogin: () => void; goToLogin: () => void }) {
  const [form, setForm] = useState({ nome: "", email: "", organizacao: "", cargo: "", senha: "", confirmSenha: "" });
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erroSenha, setErroSenha] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.senha !== form.confirmSenha) { setErroSenha(true); return; }
    setErroSenha(false);
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1100);
  };

  const cargos = [
    "Coordenador(a) Financeiro(a)",
    "Gestor(a) de Projetos",
    "Diretor(a) Executivo(a)",
    "Analista Financeiro(a)",
    "Contador(a)",
    "Assessor(a) Administrativo(a)",
    "Outro",
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[480px_1fr] bg-white">
      <AuthBrand />
      <div className="flex items-start justify-center px-8 py-10 bg-[#f4f6f9] overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <BussolaLogo size={24} />
            <span className="font-serif text-xl text-[#0f1e3d]">Financeiro MDCA</span>
            <span className="text-[10px] text-[#0e7e6e] font-mono uppercase tracking-widest">Sistema</span>
          </div>

          <h1 className="font-serif text-3xl text-[#0f1e3d] mb-1">Criar conta</h1>
          <p className="text-sm text-[#6b7a99] mb-7">Cadastre seu perfil profissional para começar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome completo">
              <input
                type="text"
                required
                value={form.nome}
                onChange={set("nome")}
                placeholder="Maria Oliveira"
                className={inputCls}
              />
            </Field>

            <Field label="E-mail profissional">
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="voce@organizacao.org.br"
                className={inputCls}
              />
            </Field>

            <Field label="Organização / ONG">
              <input
                type="text"
                required
                value={form.organizacao}
                onChange={set("organizacao")}
                placeholder="Instituto Esperança"
                className={inputCls}
              />
            </Field>

            <Field label="Cargo / função">
              <select
                required
                value={form.cargo}
                onChange={set("cargo")}
                className={inputCls + " text-[#0f1e3d] appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center]"}
              >
                <option value="">Selecionar…</option>
                {cargos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Senha">
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.senha}
                    onChange={set("senha")}
                    placeholder="Mín. 8 caracteres"
                    className={inputCls + (erroSenha ? " border-red-400 focus:ring-red-200 focus:border-red-400" : "")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a99] hover:text-[#0f1e3d] transition-colors cursor-pointer"
                  >
                    {showSenha
                      ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                      : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </Field>
              <Field label="Confirmar senha">
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  value={form.confirmSenha}
                  onChange={set("confirmSenha")}
                  placeholder="Repetir"
                  className={inputCls + (erroSenha ? " border-red-400 focus:ring-red-200 focus:border-red-400" : "")}
                />
              </Field>
            </div>
            {erroSenha && <p className="text-xs text-red-500 -mt-2">As senhas não coincidem.</p>}

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input type="checkbox" required className="mt-0.5 accent-[#0e7e6e] cursor-pointer" />
                <span className="text-xs text-[#6b7a99] leading-relaxed">
                  Concordo com os{" "}
                  <span className="text-[#1a3a6b] hover:text-[#0e7e6e] transition-colors underline decoration-dotted cursor-pointer">
                    Termos de Uso
                  </span>{" "}
                  e a{" "}
                  <span className="text-[#1a3a6b] hover:text-[#0e7e6e] transition-colors underline decoration-dotted cursor-pointer">
                    Política de Privacidade
                  </span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0e7e6e] hover:bg-[#0b6b5d] disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta…
                </>
              ) : "Criar minha conta"}
            </button>
          </form>

          <p className="text-center text-xs text-[#6b7a99] mt-5">
            Já tem uma conta?{" "}
            <button onClick={goToLogin} className="text-[#0e7e6e] font-medium hover:underline cursor-pointer">
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-11 px-4 rounded-md border border-[#d4dae7] bg-white text-sm text-[#0f1e3d] placeholder-[#b0bac9] focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b] transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState<"login" | "cadastro" | "app">("login");
  const [module, setModule] = useState<Module>("inicio");

  if (auth === "login")
    return <LoginScreen onLogin={() => setAuth("app")} goToCadastro={() => setAuth("cadastro")} />;
  if (auth === "cadastro")
    return <CadastroScreen onLogin={() => setAuth("app")} goToLogin={() => setAuth("login")} />;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <NavBar active={module} setModule={setModule} />
      <main className="max-w-screen-xl mx-auto px-6 py-7">
        {module === "inicio" && <Dashboard />}
        {module === "financeiro" && <Financeiro />}
        {module === "projetos" && <Projetos />}
        {module === "relatorios" && <Relatorios />}
        {module === "cadastros" && <Cadastros />}
      </main>
    </div>
  );
}
