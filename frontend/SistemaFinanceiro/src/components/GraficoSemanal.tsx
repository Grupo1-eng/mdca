import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getResumoSemanal } from "@/api/lancamentos";
import { useFetch } from "@/hooks/useFetch";
import { fmt } from "@/lib/format";
import { nomeDoMes, rotuloSemana, somarMeses } from "@/lib/resumoSemanal";
import type { FiltroProjeto } from "@/lib/aggregations";
import type { Lancamento, ResumoSemanal } from "@/types/financeiro";
import { DURACAO_ANIMACAO_GRAFICO } from "./FiltroPeriodo";
import { ErrorState, LoadingState } from "./StatusMessage";

const RESUMO_VAZIO: ResumoSemanal = { mes: "", semanas: [], totais: { entradas: 0, saidas: 0, saldo: 0 } };

const botaoMesCls =
  "w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer text-[var(--muted-foreground)]";

/**
 * US10 / RF30: barras de entradas e saídas por semana do mês selecionado,
 * do projeto escolhido na tela. Os números vêm do backend
 * (GET /api/lancamentos/resumo-semanal). Recebe os lançamentos só para buscar
 * de novo quando a lista muda.
 */
export default function GraficoSemanal({ mesInicial, projeto, lancamentos }: {
  mesInicial: string;
  projeto: FiltroProjeto;
  lancamentos: Lancamento[];
}) {
  const [mes, setMes] = useState(mesInicial);
  // `lancamentos` entra nas dependências só para buscar de novo quando a lista muda.
  const buscar = useCallback(() => getResumoSemanal(mes, projeto), [mes, projeto, lancamentos]);
  const { data: resumo, loading, error } = useFetch(buscar, RESUMO_VAZIO);

  const pontos = useMemo(
    () => resumo.semanas.map((s) => ({ ...s, rotulo: rotuloSemana(s) })),
    [resumo.semanas],
  );
  const semMovimento = resumo.totais.entradas === 0 && resumo.totais.saidas === 0;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Entradas e saídas por semana — <span className="text-[var(--foreground)] font-medium">{nomeDoMes(mes)}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Mês anterior" className={botaoMesCls} onClick={() => setMes((m) => somarMeses(m, -1))}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <input
            type="month"
            aria-label="Mês analisado"
            value={mes}
            onChange={(e) => e.target.value && setMes(e.target.value)}
            className="h-8 px-2 text-xs font-mono border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b]"
          />
          <button type="button" aria-label="Próximo mês" className={botaoMesCls} onClick={() => setMes((m) => somarMeses(m, 1))}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? <LoadingState /> : semMovimento ? (
        <p className="h-[260px] flex items-center justify-center text-sm text-[var(--muted-foreground)]">
          Nenhum lançamento em {nomeDoMes(mes)}.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pontos} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" vertical={false} />
              <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#6b7a99" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => fmt(Number(v))}
                labelFormatter={(_, itens) => {
                  const s = itens?.[0]?.payload as (typeof pontos)[number] | undefined;
                  return s ? `Semana ${s.semana} (${s.rotulo})` : "";
                }}
                contentStyle={{ fontSize: 12, border: "1px solid #d4dae7", borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Entradas" fill="#0e7e6e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="saidas" animationDuration={DURACAO_ANIMACAO_GRAFICO} name="Saídas" fill="#e05555" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <table className="w-full text-sm border border-[var(--border)] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                {["Semana", "Período", "Entradas", "Saídas", "Saldo"].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium ${i < 2 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pontos.map((s) => (
                <tr key={s.semana} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2.5 text-xs font-medium">Semana {s.semana}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-[var(--muted-foreground)]">{s.rotulo}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-right text-[#0e7e6e]">{fmt(s.entradas)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-right text-red-600">{fmt(s.saidas)}</td>
                  <td className={`px-4 py-2.5 text-xs font-mono text-right font-medium ${s.saldo < 0 ? "text-red-600" : ""}`}>{fmt(s.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#0f1e3d]/20 bg-[#edf0f5]">
                <td colSpan={2} className="px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wide">Total do mês</td>
                <td className="px-4 py-2.5 text-xs font-mono text-right font-semibold text-[#0e7e6e]">{fmt(resumo.totais.entradas)}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-right font-semibold text-red-600">{fmt(resumo.totais.saidas)}</td>
                <td className={`px-4 py-2.5 text-xs font-mono text-right font-semibold ${resumo.totais.saldo < 0 ? "text-red-600" : ""}`}>{fmt(resumo.totais.saldo)}</td>
              </tr>
            </tfoot>
          </table>
        </>
      )}
    </div>
  );
}
