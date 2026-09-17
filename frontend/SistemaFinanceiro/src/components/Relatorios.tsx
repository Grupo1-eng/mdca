import React, { useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt } from '@/lib/format';
import { lancamentos } from '@/data';

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

export default function Relatorios() {
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

