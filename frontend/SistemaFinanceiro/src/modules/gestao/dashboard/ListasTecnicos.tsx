import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  listarAtendimentosRecentes,
  listarEncaminhamentosEmAberto,
  type AtendimentoRecenteApi,
  type EncaminhamentoEmAbertoApi,
} from "../api/evolucoes"
import { isoParaDataLocal, statusParaTela } from "../api/evolucoesMapper"
import { dataBr } from "./painel"

// Listas do painel dos técnicos e da coordenação. Só nome do educando, data,
// destino e situação: nenhum texto de atendimento ou encaminhamento.

type Carga<T> =
  | { estado: "carregando" }
  | { estado: "pronta"; itens: T[] }
  | { estado: "erro"; mensagem: string }

function useLista<T>(buscar: () => Promise<T[]>): Carga<T> {
  const [carga, setCarga] = useState<Carga<T>>({ estado: "carregando" })
  useEffect(() => {
    let cancelado = false
    buscar()
      .then((itens) => {
        if (!cancelado) setCarga({ estado: "pronta", itens })
      })
      .catch((erro: unknown) => {
        if (!cancelado) {
          setCarga({
            estado: "erro",
            mensagem: erro instanceof Error ? erro.message : "Não foi possível carregar.",
          })
        }
      })
    return () => {
      cancelado = true
    }
  }, [buscar])
  return carga
}

function Bloco<T>({
  titulo,
  descricao,
  carga,
  vazio,
  item,
}: {
  titulo: string
  descricao: string
  carga: Carga<T>
  vazio: string
  item: (valor: T) => React.ReactNode
}) {
  return (
    <section className="bg-white rounded-lg border border-[var(--border)] p-5">
      <h2 className="font-semibold text-sm text-[var(--foreground)]">{titulo}</h2>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-4">{descricao}</p>
      {carga.estado === "carregando" && (
        <p className="text-sm text-[var(--muted-foreground)]">Carregando…</p>
      )}
      {carga.estado === "erro" && (
        <p role="alert" className="text-sm text-red-600">
          {carga.mensagem}
        </p>
      )}
      {carga.estado === "pronta" &&
        (carga.itens.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{vazio}</p>
        ) : (
          <ul className="space-y-3">{carga.itens.map(item)}</ul>
        ))}
    </section>
  )
}

function linkFicha(id: number, nome: string) {
  return (
    <Link to={`/gestao/educandos/${id}`} className="font-medium hover:underline">
      {nome}
    </Link>
  )
}

export function EncaminhamentosEmAberto() {
  const carga = useLista<EncaminhamentoEmAbertoApi>(listarEncaminhamentosEmAberto)
  return (
    <Bloco
      titulo="Encaminhamentos em aberto"
      descricao="Ainda não efetivados, dos mais antigos aos mais recentes."
      carga={carga}
      vazio="Nenhum encaminhamento em aberto."
      item={(e) => (
        <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
          <div>
            {linkFicha(e.educando.id, e.educando.nome)}
            <p className="text-xs text-[var(--muted-foreground)]">
              {e.destino || "Destino não informado"} · desde{" "}
              {dataBr(isoParaDataLocal(e.dataEncaminhamento))}
            </p>
          </div>
          <span className="shrink-0 rounded bg-[var(--secondary)] px-2 py-1 text-[10px] font-mono font-medium text-[var(--secondary-foreground)]">
            {statusParaTela(e.situacaoAtual)}
          </span>
        </li>
      )}
    />
  )
}

export function UltimosAtendimentos() {
  const carga = useLista<AtendimentoRecenteApi>(listarAtendimentosRecentes)
  return (
    <Bloco
      titulo="Últimos atendimentos registrados"
      descricao="Fichas de evolução mais recentes da equipe. O conteúdo fica na ficha do educando."
      carga={carga}
      vazio="Nenhum atendimento registrado ainda."
      item={(a) => (
        <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
          <div>
            {linkFicha(a.educando.id, a.educando.nome)}
            <p className="text-xs text-[var(--muted-foreground)]">
              {dataBr(isoParaDataLocal(a.dataInicio))} · {a.profissional.nome}
            </p>
          </div>
          {a.sigiloso && (
            <span className="shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] font-mono font-medium text-[var(--muted-foreground)]">
              Sigiloso
            </span>
          )}
        </li>
      )}
    />
  )
}
