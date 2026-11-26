import { useState } from "react"
import { consultarListaPresenca } from "../api/atividades"
import { periodoRapido } from "../dashboard/painel"
import { Card, Field, inputClass } from "../educandos/components/EducandoUi"
import { baixarArquivo } from "../exportacao"
import { gerarCsvListaPresenca, nomeArquivoLista } from "./listaPresenca"

const botao =
  "inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"

// Exporta a lista de presença da atividade no período (prestação de contas).
// Só aparece para quem exporta relatórios (coordenação e administrativo).
export default function ListaPresencaCard({ atividadeId }: { atividadeId: string }) {
  const [periodo, setPeriodo] = useState(() => periodoRapido("mes-atual"))
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const invalido = !periodo.inicio || !periodo.fim || periodo.inicio > periodo.fim

  const exportar = async () => {
    setErro(null)
    setGerando(true)
    try {
      const lista = await consultarListaPresenca(atividadeId, periodo.inicio, periodo.fim)
      baixarArquivo(gerarCsvListaPresenca(lista), nomeArquivoLista(lista), "text/csv;charset=utf-8")
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar a lista de presença.")
    } finally {
      setGerando(false)
    }
  }

  return (
    <Card className="mb-5 p-5">
      <h2 className="text-base font-semibold">Lista de presença</h2>
      <p className="mb-4 mt-0.5 text-xs text-[var(--muted-foreground)]">
        Para prestação de contas: presença de cada educando nos encontros do período
        (encontros cancelados ficam de fora). Abre no Excel.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="De">
          <input
            type="date"
            className={inputClass}
            value={periodo.inicio}
            onChange={(event) => setPeriodo({ ...periodo, inicio: event.target.value })}
          />
        </Field>
        <Field label="Até">
          <input
            type="date"
            className={inputClass}
            value={periodo.fim}
            onChange={(event) => setPeriodo({ ...periodo, fim: event.target.value })}
          />
        </Field>
        <button type="button" className={botao} disabled={invalido || gerando} onClick={exportar}>
          {gerando ? "Gerando…" : "Exportar lista (CSV)"}
        </button>
      </div>
      {invalido && (
        <p className="mt-2 text-sm text-red-600">A data inicial não pode ser depois da final.</p>
      )}
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </Card>
  )
}
