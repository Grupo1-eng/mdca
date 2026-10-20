import { useState } from "react";
import { getIntervaloPeriodo, intervaloValido, type AgrupamentoFluxo, type Intervalo, type PeriodoDash } from '@/lib/aggregations';

// Duração (ms) da transição dos gráficos ao trocar de período; o padrão do
// Recharts (1500 ms) deixava a troca lenta.
export const DURACAO_ANIMACAO_GRAFICO = 400;

/** "por semana", "por mês"… — subtítulo dos gráficos de fluxo que seguem o período. */
export const rotuloAgrupamento: Record<AgrupamentoFluxo, string> = { semana: "semana", mes: "mês", ano: "ano" };

// Filtro de período usado pelo Dashboard e pela tela Financeiro.
const periodoOpcoes: { key: PeriodoDash; label: string }[] = [
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
  { key: "trimestre", label: "Trimestre" },
  { key: "ano", label: "Este ano" },
  { key: "todos", label: "Todo o período" },
  { key: "personalizado", label: "Personalizado" },
];

export function labelPeriodo(key: PeriodoDash): string {
  return periodoOpcoes.find((o) => o.key === key)?.label ?? key;
}

export function formatIntervalo(periodo: PeriodoDash, intervalo: Intervalo): string {
  const completo = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const { inicio, fim } = intervalo;
  if (!inicio && !fim) return "Todo o período";
  if (!inicio) return `Até ${completo.format(fim!)}`;
  if (!fim) return `A partir de ${completo.format(inicio)}`;
  if (periodo === "mes") return completo.format(inicio).replace(/^\d{2} de /, "");
  const curto = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${curto.format(inicio)} a ${completo.format(fim)}`;
}

export default function FiltroPeriodo({ periodo, setPeriodo, dataIni, setDataIni, dataFim, setDataFim }: {
  periodo: PeriodoDash; setPeriodo: (p: PeriodoDash) => void;
  dataIni: string; setDataIni: (v: string) => void;
  dataFim: string; setDataFim: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // No "Personalizado", as datas digitadas ficam em rascunho e só chegam à tela
  // (cartões, tabela e gráfico) ao clicar em Aplicar. Fechar sem aplicar descarta.
  const [editandoPersonalizado, setEditandoPersonalizado] = useState(false);
  const [rascunhoIni, setRascunhoIni] = useState(dataIni);
  const [rascunhoFim, setRascunhoFim] = useState(dataFim);
  const selected = periodoOpcoes.find(o => o.key === periodo)!;
  const destacado = editandoPersonalizado ? "personalizado" : periodo;
  const invalido = !intervaloValido(getIntervaloPeriodo("personalizado", new Date(), rascunhoIni, rascunhoFim));

  const alternar = () => {
    if (!open) {
      setRascunhoIni(dataIni);
      setRascunhoFim(dataFim);
      setEditandoPersonalizado(periodo === "personalizado");
    }
    setOpen(o => !o);
  };

  const escolher = (key: PeriodoDash) => {
    if (key === "personalizado") {
      setEditandoPersonalizado(true);
      return;
    }
    setEditandoPersonalizado(false);
    setPeriodo(key);
    setOpen(false);
  };

  const aplicar = () => {
    setDataIni(rascunhoIni);
    setDataFim(rascunhoFim);
    setPeriodo("personalizado");
    setOpen(false);
  };
  return (
    <div className="relative">
      <button
        onClick={alternar}
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
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[var(--border)] rounded-lg shadow-lg w-48 overflow-hidden">
            <div className="py-1">
              {periodoOpcoes.map(op => (
                <button
                  key={op.key}
                  onClick={() => escolher(op.key)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${destacado === op.key ? "bg-[#0f1e3d]/5 text-[#0f1e3d] font-medium" : "text-[var(--foreground)] hover:bg-[var(--muted)]"}`}
                >
                  {op.label}
                  {destacado === op.key && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
            {editandoPersonalizado && (
              <div className="border-t border-[var(--border)] px-3 py-2.5 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Intervalo de datas</p>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">De</label>
                  <input type="date" value={rascunhoIni} onChange={e => setRascunhoIni(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-[var(--border)] rounded focus:outline-none focus:border-[#1a3a6b] font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">Até</label>
                  <input type="date" value={rascunhoFim} onChange={e => setRascunhoFim(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-[var(--border)] rounded focus:outline-none focus:border-[#1a3a6b] font-mono" />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">Deixe um campo vazio para não limitar aquele lado.</p>
                {invalido && <p role="alert" className="text-[10px] text-red-600">A data inicial deve ser anterior ou igual à final.</p>}
                <button onClick={aplicar} disabled={invalido} className="w-full h-8 bg-[#0f1e3d] text-white text-xs rounded hover:bg-[#1a3060] transition-colors cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
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
