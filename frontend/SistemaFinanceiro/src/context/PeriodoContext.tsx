import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getIntervaloPeriodo, msAteProximoDia, type Intervalo, type PeriodoDash } from "@/lib/aggregations";

// Período escolhido no filtro, compartilhado pelo Dashboard e pela tela
// Financeiro: trocar de tela mantém o período. Fica dentro da área logada,
// então volta ao padrão ao sair ou trocar de usuário.
interface PeriodoContextValue {
  periodo: PeriodoDash;
  setPeriodo: (p: PeriodoDash) => void;
  dataIni: string;
  setDataIni: (v: string) => void;
  dataFim: string;
  setDataFim: (v: string) => void;
  intervalo: Intervalo;
}

const PeriodoContext = createContext<PeriodoContextValue | null>(null);

export const PERIODO_PADRAO: PeriodoDash = "mes";

/** Data de hoje que se atualiza sozinha à meia-noite, com a tela aberta. */
function useHoje(): Date {
  const [hoje, setHoje] = useState(() => new Date());
  useEffect(() => {
    // +1 s de folga para o timer não disparar ainda no dia anterior.
    const timer = setTimeout(() => setHoje(new Date()), msAteProximoDia(hoje) + 1000);
    return () => clearTimeout(timer);
  }, [hoje]);
  return hoje;
}

export function PeriodoProvider({ children }: { children: React.ReactNode }) {
  const [periodo, setPeriodo] = useState<PeriodoDash>(PERIODO_PADRAO);
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const hoje = useHoje();

  const intervalo = useMemo(
    () => getIntervaloPeriodo(periodo, hoje, dataIni, dataFim),
    [periodo, hoje, dataIni, dataFim],
  );

  const value = useMemo(
    () => ({ periodo, setPeriodo, dataIni, setDataIni, dataFim, setDataFim, intervalo }),
    [periodo, dataIni, dataFim, intervalo],
  );

  return <PeriodoContext.Provider value={value}>{children}</PeriodoContext.Provider>;
}

export function usePeriodo(): PeriodoContextValue {
  const ctx = useContext(PeriodoContext);
  if (!ctx) throw new Error("usePeriodo precisa estar dentro de <PeriodoProvider>.");
  return ctx;
}
