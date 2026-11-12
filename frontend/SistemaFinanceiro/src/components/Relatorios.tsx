import React, { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt, formatDate } from '@/lib/format';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useProjetos } from '@/hooks/useProjetos';
import { useContas } from '@/hooks/useContas';
import { useCategorias } from '@/hooks/useCategorias';
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { useAuth } from '@/context/AuthContext';
import { usePeriodo } from '@/context/PeriodoContext';
import {
  arvoreCategorias, dataDoLancamento, execucaoOrcamentaria, intervaloValido, serieFluxoCaixaPeriodo, type FiltroTipo,
} from '@/lib/aggregations';
import { baixarPlanilha } from '@/lib/planilha';
import { filtrarExtrato, totaisFluxo, totaisPorCategoria } from '@/lib/relatorios';
import { rotuloSituacao, valorComSinal } from '@/lib/rotulos';
import { LoadingState, ErrorState } from './StatusMessage';
import FiltroPeriodo, { DURACAO_ANIMACAO_GRAFICO, formatIntervalo, rotuloAgrupamento } from './FiltroPeriodo';
import { chevronBg, selectCls } from './ModalShell';

type RelatorioKey = "execucao" | "extrato" | "fluxo" | "balancete";

const relatoriosMeta: { key: RelatorioKey; label: string; sublabel: string }[] = [
  { key: "execucao", label: "Execução Orçamentária", sublabel: "Por projeto e categoria" },
  { key: "extrato", label: "Extrato Financeiro", sublabel: "Por período, projeto e categoria" },
  { key: "fluxo", label: "Fluxo de Caixa", sublabel: "Realizado vs. previsto" },
  { key: "balancete", label: "Balancete", sublabel: "Prestação de contas" },
];

const rotuloTipo: Record<FiltroTipo, string> = { todos: "Todos", entrada: "Entradas", saida: "Saídas" };

/** Botão de exportação em planilha: mostra o andamento e o erro, se houver. */
function BotaoExportar({ gerar, desabilitado }: { gerar: () => Promise<void>; desabilitado?: boolean }) {
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const exportar = async () => {
    setExportando(true);
    setErro(null);
    try {
      await gerar();
    } catch {
      setErro("Não foi possível gerar a planilha.");
    } finally {
      setExportando(false);
    }
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={exportar}
        disabled={exportando || desabilitado}
        className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {exportando ? "Gerando…" : "Exportar planilha"}
      </button>
      {erro && <p className="text-[10px] text-red-600">{erro}</p>}
    </div>
  );
}

/** Filtro de período dos relatórios: o mesmo do Painel e da tela Financeiro. */
function PeriodoRelatorio() {
  const { periodo, setPeriodo, dataIni, setDataIni, dataFim, setDataFim } = usePeriodo();
  return (
    <FiltroPeriodo
      periodo={periodo} setPeriodo={setPeriodo}
      dataIni={dataIni} setDataIni={setDataIni}
      dataFim={dataFim} setDataFim={setDataFim}
    />
  );
}

function RelExecucao() {
  const projetos = useProjetos();
  const categorias = useCategorias();
  const orcamentos = useOrcamentos();
  const lancamentos = useLancamentos();
  const { user } = useAuth();
  const fontes = [projetos, categorias, orcamentos, lancamentos];
  const loading = fontes.some(f => f.loading);
  const error = fontes.find(f => f.error)?.error ?? null;
  const execucaoData = useMemo(
    () => execucaoOrcamentaria(projetos.data, categorias.data, orcamentos.data, lancamentos.data),
    [projetos.data, categorias.data, orcamentos.data, lancamentos.data],
  );
  const [expanded, setExpanded] = useState<number | null>(null);

  const totalOrcado = execucaoData.reduce((a, b) => a + b.orcado, 0);
  const totalRealizado = execucaoData.reduce((a, b) => a + b.realizado, 0);

  const exportar = () => baixarPlanilha({
    titulo: "Execução Orçamentária",
    filtros: ["Orçado: orçamentos cadastrados · Realizado: saídas pagas"],
    usuario: user?.nome ?? null,
    geradoEm: new Date(),
    colunas: ["Projeto", "Categoria", "Orçado", "Realizado", "Saldo"],
    linhas: execucaoData.flatMap((p) => [
      [p.projeto, null, p.orcado, p.realizado, p.orcado - p.realizado],
      ...p.categorias.map((c) => [p.projeto, c.nome, c.orcado, c.realizado, c.orcado - c.realizado]),
    ]),
    totais: ["Total geral", null, totalOrcado, totalRealizado, totalOrcado - totalRealizado],
  }, [30, 26, 14, 14, 14]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Execução Orçamentária</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Orçado (orçamentos cadastrados) vs. realizado (saídas pagas), por projeto e categoria</p>
        </div>
        <BotaoExportar gerar={exportar} desabilitado={loading || execucaoData.length === 0} />
      </div>
      {error && <ErrorState message={error} />}
      {loading ? <LoadingState /> : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f1e3d] text-white">
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wide font-medium">Projeto / Categoria</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium">Orçado</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium">Realizado</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium">Saldo</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-wide font-medium w-36">Execução</th>
              </tr>
            </thead>
            <tbody>
              {execucaoData.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-[var(--muted-foreground)]">Nenhum projeto com orçamento cadastrado.</td></tr>
              )}
              {execucaoData.map((p) => {
                const pct = p.orcado > 0 ? Math.round((p.realizado / p.orcado) * 100) : 0;
                const isOpen = expanded === p.projetoId;
                return (
                  <React.Fragment key={p.projetoId}>
                    <tr
                      className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] cursor-pointer transition-colors"
                      onClick={() => setExpanded(isOpen ? null : p.projetoId)}
                    >
                      <td className="px-5 py-3 font-semibold text-[var(--foreground)] flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
                        {p.projeto}
                      </td>
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
                <td className="px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wide text-[var(--foreground)]">Total Geral</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{fmt(totalOrcado)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-[#0e7e6e]">{fmt(totalRealizado)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{fmt(totalOrcado - totalRealizado)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">
                    {totalOrcado > 0 ? Math.round((totalRealizado / totalOrcado) * 100) : 0}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// RF07: extrato por período, projeto e categoria, com totais por categoria.
function RelExtrato() {
  const { data: lancamentos, loading: loadingLancamentos, error } = useLancamentos();
  const { data: projetos, loading: loadingProjetos } = useProjetos();
  const { data: contas, loading: loadingContas } = useContas();
  const { data: categorias, loading: loadingCategorias } = useCategorias();
  const { periodo, intervalo } = usePeriodo();
  const { user } = useAuth();
  const loading = loadingLancamentos || loadingProjetos || loadingContas || loadingCategorias;

  const nomeProjeto = useMemo(() => new Map(projetos.map(p => [p.id, p.nome])), [projetos]);
  const nomeConta = useMemo(() => new Map(contas.map(c => [c.id, c.nome])), [contas]);
  const nomeCategoria = useMemo(() => new Map(categorias.map(c => [c.id, c.nome])), [categorias]);
  const arvore = useMemo(() => arvoreCategorias(categorias), [categorias]);

  const [termo, setTermo] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");
  const [projetoId, setProjetoId] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  const filtered = useMemo(
    () => filtrarExtrato(lancamentos, { intervalo, projetoId, categoriaId, tipo, termo }, categorias, nomeProjeto),
    [lancamentos, intervalo, projetoId, categoriaId, tipo, termo, categorias, nomeProjeto],
  );
  const porCategoria = useMemo(() => totaisPorCategoria(filtered, categorias), [filtered, categorias]);
  const totalE = filtered.filter(l => l.tipo === "entrada").reduce((a, b) => a + b.valor, 0);
  const totalS = filtered.filter(l => l.tipo === "saida").reduce((a, b) => a + b.valor, 0);

  const exportar = () => baixarPlanilha({
    titulo: "Extrato Financeiro",
    filtros: [
      `Período: ${formatIntervalo(periodo, intervalo)}`,
      `Projeto: ${projetoId !== null ? nomeProjeto.get(projetoId) ?? projetoId : "Todos"}`,
      `Categoria: ${categoriaId !== null ? nomeCategoria.get(categoriaId) ?? categoriaId : "Todas"}`,
      `Tipo: ${rotuloTipo[tipo]}`,
      ...(termo.trim() ? [`Busca: ${termo.trim()}`] : []),
    ],
    usuario: user?.nome ?? null,
    geradoEm: new Date(),
    colunas: ["Data", "Descrição", "Projeto", "Conta", "Categoria", "Situação", "Entrada", "Saída"],
    linhas: filtered.map((l) => [
      formatDate(dataDoLancamento(l)),
      l.descricao ?? "",
      l.projetoId ? nomeProjeto.get(l.projetoId) ?? "" : "",
      nomeConta.get(l.contaId) ?? "",
      nomeCategoria.get(l.categoriaId) ?? "",
      rotuloSituacao[l.situacao],
      l.tipo === "entrada" ? l.valor : null,
      l.tipo === "saida" ? l.valor : null,
    ]),
    totais: [`${filtered.length} lançamentos`, null, null, null, null, "Totais", totalE, totalS],
  }, [12, 36, 22, 18, 22, 12, 14, 14]);

  const selectFiltroCls = selectCls + " h-9 text-xs pr-8 w-auto";

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Extrato Financeiro</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatIntervalo(periodo, intervalo)}</p>
        </div>
        <div className="flex items-start gap-2">
          <PeriodoRelatorio />
          <BotaoExportar gerar={exportar} desabilitado={loading || filtered.length === 0} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Buscar descrição ou projeto…"
            value={termo}
            onChange={e => setTermo(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors"
          />
        </div>
        <select
          aria-label="Projeto"
          value={projetoId ?? ""}
          onChange={e => setProjetoId(e.target.value ? Number(e.target.value) : null)}
          className={selectFiltroCls} style={chevronBg}
        >
          <option value="">Todos os projetos</option>
          {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select
          aria-label="Categoria"
          value={categoriaId ?? ""}
          onChange={e => setCategoriaId(e.target.value ? Number(e.target.value) : null)}
          className={selectFiltroCls} style={chevronBg}
        >
          <option value="">Todas as categorias</option>
          {arvore.map(({ categoria, subcategorias }) => (
            <React.Fragment key={categoria.id}>
              <option value={categoria.id}>{categoria.nome}</option>
              {subcategorias.map(s => <option key={s.id} value={s.id}>{"  — "}{s.nome}</option>)}
            </React.Fragment>
          ))}
        </select>
        <div className="flex rounded-md border border-[var(--border)] overflow-hidden bg-white text-xs">
          {(["todos", "entrada", "saida"] as const).map((t) => (
            <button key={t} onClick={() => setTipo(t)}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${tipo === t ? "bg-[#0f1e3d] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}>
              {rotuloTipo[t]}
            </button>
          ))}
        </div>
      </div>
      {error && <ErrorState message={error} />}
      {loading ? <LoadingState /> : (
        <>
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-xs text-[var(--muted-foreground)]">
                      {intervaloValido(intervalo)
                        ? "Nenhum lançamento com os filtros selecionados."
                        : "Período inválido: a data inicial deve ser anterior ou igual à final."}
                    </td>
                  </tr>
                )}
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)] whitespace-nowrap">{formatDate(dataDoLancamento(l))}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{l.descricao}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{l.projetoId ? nomeProjeto.get(l.projetoId) ?? "—" : "—"}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] whitespace-nowrap">{nomeConta.get(l.contaId) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                        l.situacao==="recebido"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":l.situacao==="pago"?"bg-[#0f1e3d]/10 text-[#0f1e3d]":"bg-amber-100 text-amber-700"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${l.situacao==="recebido"?"bg-[#0e7e6e]":l.situacao==="pago"?"bg-[#0f1e3d]":"bg-amber-500"}`}/>
                        {rotuloSituacao[l.situacao]}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-mono text-xs font-medium whitespace-nowrap ${l.tipo==="entrada"?"text-[#0e7e6e]":"text-red-600"}`}>
                      {l.tipo==="entrada"?"+":""}{fmt(valorComSinal(l.valor, l.tipo))}
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

          {porCategoria.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Totais por categoria</h3>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                      {["Categoria", "Entradas", "Saídas"].map((h, i) => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {porCategoria.map((c) => (
                      <tr key={c.categoria} className="border-t border-[var(--border)]">
                        <td className="px-4 py-2.5 text-xs">{c.categoria}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-right text-[#0e7e6e]">{c.entradas ? fmt(c.entradas) : "—"}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-right text-red-600">{c.saidas ? fmt(c.saidas) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// RF29 / RF56: realizado vs. previsto no período selecionado, exportável em planilha.
function RelFluxo() {
  const { data: lancamentos, loading, error } = useLancamentos();
  const { periodo, intervalo } = usePeriodo();
  const { user } = useAuth();
  const serie = useMemo(() => serieFluxoCaixaPeriodo(lancamentos, intervalo), [lancamentos, intervalo]);
  const totais = useMemo(() => totaisFluxo(serie.pontos), [serie.pontos]);

  const exportar = () => baixarPlanilha({
    titulo: "Fluxo de Caixa",
    filtros: [
      `Período: ${formatIntervalo(periodo, intervalo)}`,
      "Previsto: todos os lançamentos do período · Realizado: só os pagos/recebidos",
    ],
    usuario: user?.nome ?? null,
    geradoEm: new Date(),
    colunas: ["Período", "Entradas previstas", "Entradas realizadas", "Saídas previstas", "Saídas realizadas", "Saldo realizado"],
    linhas: serie.pontos.map((p) => [
      p.label, p.previsto, p.realizado, p.saidasPrevisto, p.saidasRealizado, p.realizado - p.saidasRealizado,
    ]),
    totais: [
      "Total", totais.entradasPrevistas, totais.entradasRealizadas, totais.saidasPrevistas, totais.saidasRealizadas, totais.saldoRealizado,
    ],
  }, [14, 18, 18, 18, 18, 18]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Fluxo de Caixa</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Realizado vs. previsto por {rotuloAgrupamento[serie.agrupamento]} — {formatIntervalo(periodo, intervalo)}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <PeriodoRelatorio />
          <BotaoExportar gerar={exportar} desabilitado={loading || serie.pontos.length === 0} />
        </div>
      </div>
      {error && <ErrorState message={error} />}
      {loading ? <LoadingState /> : serie.pontos.length === 0 ? (
        <p className="h-[280px] flex items-center justify-center text-sm text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg bg-white">
          {intervaloValido(intervalo)
            ? "Nenhum lançamento no período selecionado."
            : "Período inválido: a data inicial deve ser anterior ou igual à final."}
        </p>
      ) : (
        <>
          <div className="border border-[var(--border)] rounded-lg p-5 bg-white mb-4">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={serie.pontos} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${v/1000}k`} tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ fontSize: 12, border: "1px solid #d4dae7", borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="realizado" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Entradas realizadas" stroke="#0e7e6e" strokeWidth={2} fill="url(#flxE)" dot={{ r: 3, fill: "#0e7e6e" }} />
                <Area type="monotone" dataKey="previsto" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Entradas previstas" stroke="#0e7e6e" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
                <Area type="monotone" dataKey="saidasRealizado" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Saídas realizadas" stroke="#e05555" strokeWidth={2} fill="url(#flxS)" dot={{ r: 3, fill: "#e05555" }} />
                <Area type="monotone" dataKey="saidasPrevisto" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Saídas previstas" stroke="#e05555" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Total entradas realizadas", value: fmt(totais.entradasRealizadas), color: "text-[#0e7e6e]" },
              { label: "Total saídas realizadas", value: fmt(totais.saidasRealizadas), color: "text-red-600" },
              { label: "Resultado do período", value: fmt(totais.saldoRealizado), color: totais.saldoRealizado < 0 ? "text-red-600" : "text-[var(--foreground)]" },
            ].map((c) => (
              <div key={c.label} className="border border-[var(--border)] rounded-lg p-4 bg-white">
                <p className="text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">{c.label}</p>
                <p className={`text-xl font-semibold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                  {["Período", "Entradas previstas", "Entradas realizadas", "Saídas previstas", "Saídas realizadas", "Saldo realizado"].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {serie.pontos.map((p) => {
                  const saldo = p.realizado - p.saidasRealizado;
                  return (
                    <tr key={p.label} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-xs font-mono">{p.label}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-right text-[var(--muted-foreground)]">{fmt(p.previsto)}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-right text-[#0e7e6e]">{fmt(p.realizado)}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-right text-[var(--muted-foreground)]">{fmt(p.saidasPrevisto)}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-right text-red-600">{fmt(p.saidasRealizado)}</td>
                      <td className={`px-4 py-2.5 text-xs font-mono text-right font-medium ${saldo < 0 ? "text-red-600" : ""}`}>{fmt(saldo)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#0f1e3d]/20 bg-[#edf0f5]">
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wide">Total</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-right font-semibold">{fmt(totais.entradasPrevistas)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-right font-semibold text-[#0e7e6e]">{fmt(totais.entradasRealizadas)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-right font-semibold">{fmt(totais.saidasPrevistas)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-right font-semibold text-red-600">{fmt(totais.saidasRealizadas)}</td>
                  <td className={`px-4 py-2.5 text-xs font-mono text-right font-semibold ${totais.saldoRealizado < 0 ? "text-red-600" : ""}`}>{fmt(totais.saldoRealizado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// O balancete agrupa movimentações por fonte de recurso, mas hoje nenhum
// lançamento ou orçamento aponta para uma fonte no banco (pendência registrada
// em backend/prisma/schema.prisma, model FonteDeRecurso).
function RelBalancete() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="font-semibold text-[var(--foreground)]">Balancete de Prestação de Contas</h2>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Por fonte de recursos</p>
      </div>
      <div className="border border-amber-200 bg-amber-50 rounded-lg px-5 py-4 text-sm text-amber-800 leading-relaxed">
        Relatório indisponível: os lançamentos ainda não são vinculados a uma fonte de recursos,
        então não há como separar entradas e saídas por fonte.
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
