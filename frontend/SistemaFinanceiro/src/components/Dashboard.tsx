import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmt, formatDate } from '@/lib/format';
import { useLancamentos } from '@/hooks/useLancamentos';
import { useContas } from '@/hooks/useContas';
import {
  intervaloValido, resumoPeriodo, saldoTotalContas, contasPagas, contasParaPainel, contasPendentes,
  serieFluxoCaixaPeriodo, type ContaPendente,
} from '@/lib/aggregations';
import { usePeriodo } from '@/context/PeriodoContext';
import { LoadingState, ErrorState } from './StatusMessage';
import FiltroPeriodo, { DURACAO_ANIMACAO_GRAFICO, formatIntervalo, labelPeriodo, rotuloAgrupamento } from './FiltroPeriodo';

export function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-3">{label}</p>
      <p className={`text-2xl font-semibold ${color ?? "text-[var(--foreground)]"}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>}
    </div>
  );
}

/** Linha de uma conta a pagar/receber: descrição, data e valor com sinal. */
function ItemConta({ conta }: { conta: ContaPendente }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--foreground)] truncate">{conta.descricao}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{formatDate(conta.vencimento)}</p>
      </div>
      <span className={`text-xs font-mono font-medium shrink-0 ${conta.tipo === "receber" ? "text-[#0e7e6e]" : "text-red-600"}`}>
        {conta.tipo === "receber" ? "+" : "-"}{fmt(conta.valor)}
      </span>
    </div>
  );
}

// Quantas contas pagas o card mostra antes de resumir o restante.
const MAX_PAGAS = 5;

type AbaPendencias = "vencidas" | "pagas";

export default function Dashboard() {
  const { data: lancamentos, loading: loadingLancamentos, error: errorLancamentos } = useLancamentos();
  const { data: contas, loading: loadingContas, error: errorContas } = useContas();
  const { periodo, setPeriodo, dataIni, setDataIni, dataFim, setDataFim, intervalo } = usePeriodo();

  const loading = loadingLancamentos || loadingContas;
  const error = errorLancamentos ?? errorContas;

  const resumo = useMemo(() => resumoPeriodo(lancamentos, intervalo), [lancamentos, intervalo]);
  const { vencidas, vencendo } = useMemo(() => contasPendentes(lancamentos), [lancamentos]);
  const pagas = useMemo(() => contasPagas(lancamentos, intervalo), [lancamentos, intervalo]);
  const contasOrdenadas = useMemo(() => contasParaPainel(contas), [contas]);
  const [abaPendencias, setAbaPendencias] = useState<AbaPendencias>("vencidas");
  const fluxo = useMemo(() => serieFluxoCaixaPeriodo(lancamentos, intervalo), [lancamentos, intervalo]);
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
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Realizado vs. Previsto por {rotuloAgrupamento[fluxo.agrupamento]} — {formatIntervalo(periodo, intervalo)}
                  </p>
                </div>
              </div>
              {fluxo.pontos.length === 0 ? (
                <p className="h-[220px] flex items-center justify-center text-sm text-[var(--muted-foreground)]">
                  {intervaloValido(intervalo)
                    ? "Nenhum lançamento no período selecionado."
                    : "Período inválido: a data inicial deve ser anterior ou igual à final."}
                </p>
              ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={fluxo.pontos} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => fmt(Number(v))}
                    contentStyle={{ fontSize: 12, border: "1px solid #d4dae7", borderRadius: 6, fontFamily: "Instrument Sans" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="realizado" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Realizado" stroke="#0e7e6e" strokeWidth={2} fill="url(#colorRealizado)" dot={{ r: 3, fill: "#0e7e6e" }} />
                  <Area type="monotone" dataKey="previsto" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Previsto" stroke="#1a3a6b" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#colorPrevisto)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-4">
              {/* RF27: vencidas e pagas em abas separadas, nunca misturadas. */}
              <div className="bg-white rounded-lg border border-[var(--border)] p-5">
                <div className="flex items-center gap-1 mb-3" role="tablist">
                  {([
                    { key: "vencidas", label: "Vencidas", qtd: vencidas.length, cor: "bg-red-500", badge: "bg-red-50 text-red-600" },
                    { key: "pagas", label: "Pagas", qtd: pagas.length, cor: "bg-[#0e7e6e]", badge: "bg-[#0e7e6e]/10 text-[#0e7e6e]" },
                  ] as const).map((aba) => (
                    <button
                      key={aba.key}
                      role="tab"
                      aria-selected={abaPendencias === aba.key}
                      onClick={() => setAbaPendencias(aba.key)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
                        abaPendencias === aba.key ? "font-semibold bg-[var(--muted)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${aba.cor}`} />
                      {aba.label}
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${aba.badge}`}>{aba.qtd}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {abaPendencias === "vencidas" ? (
                    <>
                      {vencidas.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Nenhuma pendência vencida.</p>}
                      {vencidas.map((c, i) => <ItemConta key={i} conta={c} />)}
                    </>
                  ) : (
                    <>
                      {pagas.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">Nenhuma conta paga ou recebida no período.</p>}
                      {pagas.slice(0, MAX_PAGAS).map((c, i) => <ItemConta key={i} conta={c} />)}
                      {pagas.length > MAX_PAGAS && (
                        <p className="text-xs text-[var(--muted-foreground)]">e mais {pagas.length - MAX_PAGAS} no período</p>
                      )}
                    </>
                  )}
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
                  {vencendo.map((c, i) => <ItemConta key={i} conta={c} />)}
                </div>
              </div>
            </div>
          </div>

          {/* RF24 / RF64: saldo de cada conta, atualizado pelos lançamentos realizados. */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-[var(--foreground)]">Saldo por conta</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Considera só lançamentos pagos ou recebidos</p>
            </div>
            {contasOrdenadas.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">Nenhuma conta cadastrada.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {contasOrdenadas.map((c) => (
                  <div key={c.id} className={`border border-[var(--border)] rounded-md px-4 py-3 ${c.ativa ? "" : "opacity-60"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate">{c.nome}</p>
                      {!c.ativa && <span className="text-[10px] font-mono uppercase text-[var(--muted-foreground)]">inativa</span>}
                    </div>
                    <p className={`text-lg font-semibold font-mono mt-1 ${c.saldoAtual < 0 ? "text-red-600" : "text-[var(--foreground)]"}`}>
                      {fmt(c.saldoAtual)}
                    </p>
                    {c.tipo && <p className="text-[10px] text-[var(--muted-foreground)] capitalize">{c.tipo}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
