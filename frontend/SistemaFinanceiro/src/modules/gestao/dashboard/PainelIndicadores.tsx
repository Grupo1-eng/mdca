import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { consultarPainel, type FiltrosPainel, type PainelApi } from "../api/painel"
import { useEducandosGestao } from "../educandos/EducandosContext"
import { inputClass } from "../educandos/components/EducandoUi"
import {
  PERIODOS_RAPIDOS,
  comOrcamento,
  gerarCsvPainel,
  gerarRelatorioHtml,
  moeda,
  percentual,
  periodoRapido,
  podeExportarPainel,
  tipoIniciativa,
} from "./painel"

// Painel filtrável para prestação de contas (US05, RF15, RF16): período e
// iniciativa, indicadores recalculados no backend (RN07), atendimentos e
// encontros contados à parte (RN08), exportação em CSV e PDF.

const botao =
  "inline-flex h-9 items-center justify-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"

type Carga =
  | { estado: "carregando" }
  | { estado: "pronta"; painel: PainelApi }
  | { estado: "erro"; mensagem: string }

function Destaque({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string
  valor: string
  detalhe: string
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="mb-2 text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
        {rotulo}
      </p>
      <p className="text-2xl font-semibold text-[var(--foreground)]">{valor}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{detalhe}</p>
    </div>
  )
}

function baixarArquivo(conteudo: string, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = document.createElement("a")
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}

export default function PainelIndicadores() {
  const { user } = useAuth()
  const exporta = podeExportarPainel(user?.perfil)
  const { iniciativas, carregarIniciativas } = useEducandosGestao()
  const [filtros, setFiltros] = useState<FiltrosPainel>(() => ({
    ...periodoRapido("mes-atual"),
    iniciativaId: "",
  }))
  const [carga, setCarga] = useState<Carga>({ estado: "carregando" })
  const [avisoExportacao, setAvisoExportacao] = useState<string | null>(null)

  useEffect(() => {
    carregarIniciativas()
  }, [carregarIniciativas])

  const periodoInvalido =
    !filtros.inicio || !filtros.fim || filtros.inicio > filtros.fim

  useEffect(() => {
    if (periodoInvalido) return
    let cancelado = false
    setCarga({ estado: "carregando" })
    consultarPainel(filtros)
      .then((painel) => {
        if (!cancelado) setCarga({ estado: "pronta", painel })
      })
      .catch((erro: unknown) => {
        if (cancelado) return
        setCarga({
          estado: "erro",
          mensagem:
            erro instanceof Error ? erro.message : "Não foi possível carregar o painel.",
        })
      })
    return () => {
      cancelado = true
    }
  }, [filtros, periodoInvalido])

  const painel = carga.estado === "pronta" ? carga.painel : null
  const orcamento = painel ? comOrcamento(painel) : false
  const nomeArquivo = `painel-gestao-${filtros.inicio}-a-${filtros.fim}`

  const exportarCsv = () => {
    if (!painel) return
    baixarArquivo(gerarCsvPainel(painel), `${nomeArquivo}.csv`, "text/csv;charset=utf-8")
  }

  const exportarPdf = () => {
    if (!painel) return
    const janela = window.open("", "_blank")
    if (!janela) {
      setAvisoExportacao(
        "O navegador bloqueou a janela do relatório. Permita pop-ups para este site e tente de novo.",
      )
      return
    }
    setAvisoExportacao(null)
    janela.document.write(gerarRelatorioHtml(painel))
    janela.document.close()
    janela.focus()
    janela.print()
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Painel de indicadores
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Para prestação de contas: escolha o período e a iniciativa. Os números
            são recalculados a cada filtro.
          </p>
        </div>
        {exporta && (
          <div className="flex gap-2">
            <button type="button" className={botao} disabled={!painel} onClick={exportarCsv}>
              Exportar CSV
            </button>
            <button type="button" className={botao} disabled={!painel} onClick={exportarPdf}>
              Exportar PDF
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-[var(--muted-foreground)]">
          De
          <input
            type="date"
            className={`${inputClass} mt-1 block w-40`}
            value={filtros.inicio}
            onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })}
          />
        </label>
        <label className="text-xs font-medium text-[var(--muted-foreground)]">
          Até
          <input
            type="date"
            className={`${inputClass} mt-1 block w-40`}
            value={filtros.fim}
            onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })}
          />
        </label>
        <label className="text-xs font-medium text-[var(--muted-foreground)]">
          Iniciativa
          <select
            className={`${inputClass} mt-1 block w-64`}
            value={filtros.iniciativaId}
            onChange={(e) => setFiltros({ ...filtros, iniciativaId: e.target.value })}
          >
            <option value="">Todas as iniciativas</option>
            {iniciativas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} ({i.tipo})
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-1">
          {PERIODOS_RAPIDOS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1a3a6b] hover:bg-[var(--muted)]"
              onClick={() => setFiltros({ ...filtros, ...periodoRapido(p.id) })}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {periodoInvalido && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          Escolha um período válido: a data inicial não pode ser depois da final.
        </p>
      )}
      {avisoExportacao && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {avisoExportacao}
        </p>
      )}
      {!periodoInvalido && carga.estado === "carregando" && (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">Calculando indicadores…</p>
      )}
      {!periodoInvalido && carga.estado === "erro" && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {carga.mensagem}
        </p>
      )}

      {!periodoInvalido && painel && (
        <>
          <div
            className={`mt-4 grid gap-3 sm:grid-cols-2 ${orcamento ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
          >
            <Destaque
              rotulo="Educandos atendidos"
              valor={String(painel.totais.educandosAtendidos)}
              detalhe="Com presença ou atendimento no período"
            />
            <Destaque
              rotulo="Atendimentos registrados"
              valor={String(painel.totais.atendimentosRegistrados)}
              detalhe="Fichas de evolução no período"
            />
            <Destaque
              rotulo="Encontros realizados"
              valor={String(painel.totais.encontrosRealizados)}
              detalhe="Encontros de atividades marcados como realizados"
            />
            <Destaque
              rotulo="Frequência média"
              valor={percentual(painel.totais.frequenciaMedia)}
              detalhe={
                painel.totais.frequenciaMedia === null
                  ? "Sem chamada registrada no período"
                  : `${painel.totais.presencas} presenças em ${painel.totais.presencas + painel.totais.ausencias} registros`
              }
            />
            {orcamento && (
              <Destaque
                rotulo="Orçamento das iniciativas"
                valor={moeda(painel.totais.orcamentoTotal)}
                detalhe="Soma do orçamento total (só coordenação)"
              />
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            {painel.porIniciativa.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nenhuma iniciativa cadastrada.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Indicadores por iniciativa</caption>
                <thead className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Iniciativa</th>
                    <th className="px-3 py-2 text-right font-medium">Educandos atendidos</th>
                    <th className="px-3 py-2 text-right font-medium">Atendimentos</th>
                    <th className="px-3 py-2 text-right font-medium">Encontros realizados</th>
                    <th className="px-3 py-2 text-right font-medium">Frequência média</th>
                    {orcamento && (
                      <th className="px-3 py-2 text-right font-medium">Orçamento total</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {painel.porIniciativa.map((linha) => (
                    <tr key={linha.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-3 py-2">
                        <span className="font-medium">{linha.nome}</span>
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                          {tipoIniciativa(linha.tipo)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{linha.educandosAtendidos}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{linha.atendimentosRegistrados}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{linha.encontrosRealizados}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {percentual(linha.frequenciaMedia)}
                      </td>
                      {orcamento && (
                        <td className="px-3 py-2 text-right tabular-nums">
                          {moeda(linha.orcamentoTotal)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            A frequência considera só encontros marcados como realizados. Um
            atendimento sem iniciativa própria conta para as iniciativas do
            educando, então a soma das linhas pode passar do total.
          </p>
        </>
      )}
    </section>
  )
}
