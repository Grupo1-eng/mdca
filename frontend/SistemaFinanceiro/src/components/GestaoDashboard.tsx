import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useAgendaGestao } from "@/modules/gestao/agenda/AgendaContext"
import {
  cadastrosSemDocumento,
  compromissosAgendados,
  educandosAtivos,
  educandosPorIniciativa,
  hojeLocal,
  proximosCompromissos,
} from "@/modules/gestao/dashboard/indicadores"
import { useEducandosGestao } from "@/modules/gestao/educandos/EducandosContext"

// Educandos e agenda vêm da API. Atendimentos, encaminhamentos, encontros e
// indicadores por iniciativa dependem de rotas que ainda não existem e
// aparecem como "próxima etapa", sem números de exemplo.

const PROXIMA_ETAPA = "Disponível na próxima etapa da integração"

function formatarData(data: string) {
  return data.split("-").reverse().join("/")
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex text-[10px] font-mono font-medium px-2 py-1 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)]">
      {children}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string
  value: number | string
  sub: string
}) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
        {label}
      </p>
      <p className="text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>
    </div>
  )
}

function EmBreve({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="bg-white rounded-lg border border-dashed border-[var(--border)] p-5">
      <h2 className="font-semibold text-sm text-[var(--foreground)]">{titulo}</h2>
      <p className="text-xs text-[var(--muted-foreground)] mt-1">{texto}</p>
    </section>
  )
}

function ProximosCompromissos() {
  const { compromissos, carga } = useAgendaGestao()
  const proximos = proximosCompromissos(compromissos, hojeLocal())

  return (
    <section className="bg-white rounded-lg border border-[var(--border)] p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-sm text-[var(--foreground)]">
            Próximos compromissos
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-4">
            Agenda da equipe nos próximos dias.
          </p>
        </div>
        <Link to="/gestao/agenda" className="text-xs text-[#0e7e6e] hover:underline">
          Ver agenda
        </Link>
      </div>
      <ul className="space-y-3">
        {carga === "pronta" &&
          proximos.map((compromisso) => (
            <li
              key={compromisso.id}
              className="rounded-lg border border-[var(--border)] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {compromisso.titulo}
                </p>
                <Badge>{compromisso.tipo}</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {formatarData(compromisso.data)} às {compromisso.horario}
                {compromisso.local ? ` · ${compromisso.local}` : ""}
              </p>
            </li>
          ))}
        {carga === "pronta" && proximos.length === 0 && (
          <li className="text-sm text-[var(--muted-foreground)]">
            Nenhum compromisso agendado.
          </li>
        )}
        {(carga === "ociosa" || carga === "carregando") && (
          <li className="text-sm text-[var(--muted-foreground)]">
            Carregando agenda…
          </li>
        )}
        {carga === "erro" && (
          <li className="text-sm text-[var(--muted-foreground)]">
            Não foi possível carregar a agenda.
          </li>
        )}
      </ul>
    </section>
  )
}

function PendenciasCadastrais() {
  const { educandos, cargaEducandos } = useEducandosGestao()
  const semDocumento = cadastrosSemDocumento(educandos)

  return (
    <section className="bg-white rounded-lg border border-[var(--border)] p-5">
      <h2 className="font-semibold text-sm">Pendências cadastrais</h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {cargaEducandos !== "pronta"
          ? "Carregando cadastros…"
          : semDocumento === 0
            ? "Todos os educandos ativos têm CPF e NIS informados."
            : `${semDocumento} educando(s) ativo(s) sem CPF ou NIS informado.`}
      </p>
    </section>
  )
}

function EducandosPorIniciativa() {
  const { educandos, iniciativas, cargaEducandos } = useEducandosGestao()
  const linhas = educandosPorIniciativa(educandos, iniciativas)

  return (
    <section className="bg-white rounded-lg border border-[var(--border)] p-5">
      <h2 className="font-semibold text-sm mb-4">
        Educandos por projeto, serviço ou programa
      </h2>
      <ul className="space-y-3">
        {cargaEducandos === "pronta" &&
          linhas.map(({ iniciativa, ativos }) => (
            <li
              key={iniciativa.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>
                {iniciativa.nome}{" "}
                <span className="text-xs text-[var(--muted-foreground)]">
                  ({iniciativa.tipo})
                </span>
              </span>
              <Badge>{ativos} ativos</Badge>
            </li>
          ))}
        {cargaEducandos === "pronta" && linhas.length === 0 && (
          <li className="text-sm text-[var(--muted-foreground)]">
            Nenhuma iniciativa cadastrada.
          </li>
        )}
        {cargaEducandos !== "pronta" && (
          <li className="text-sm text-[var(--muted-foreground)]">Carregando…</li>
        )}
      </ul>
    </section>
  )
}

function PainelDoPerfil() {
  const { user } = useAuth()

  if (user?.perfil === "administrativo") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <PendenciasCadastrais />
        <EducandosPorIniciativa />
      </div>
    )
  }
  if (user?.perfil === "educador") return null
  if (
    user?.perfil === "tecnico_servico_social" ||
    user?.perfil === "tecnico_psicologia"
  ) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <EmBreve
          titulo="Encaminhamentos em aberto"
          texto={`${PROXIMA_ETAPA}. Por enquanto, consulte na ficha de cada educando.`}
        />
        <EmBreve
          titulo="Últimos atendimentos registrados"
          texto={`${PROXIMA_ETAPA}. Por enquanto, consulte na ficha de cada educando.`}
        />
      </div>
    )
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PendenciasCadastrais />
      <EducandosPorIniciativa />
      <EmBreve
        titulo="Encontros e frequência por iniciativa"
        texto={`${PROXIMA_ETAPA}: encontros realizados, frequência média e atendimentos por iniciativa.`}
      />
    </div>
  )
}

export default function GestaoDashboard() {
  const { educandos, cargaEducandos, carregarEducandos } = useEducandosGestao()
  const { compromissos, carga, carregarCompromissos } = useAgendaGestao()

  useEffect(() => {
    carregarEducandos()
    carregarCompromissos()
  }, [carregarEducandos, carregarCompromissos])

  const valor = (pronto: boolean, n: number) => (pronto ? n : "…")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[var(--foreground)]">
          Visão geral
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Panorama do atendimento a crianças e adolescentes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Educandos ativos"
          value={valor(cargaEducandos === "pronta", educandosAtivos(educandos))}
          sub="Vínculos ativos na organização"
        />
        <SummaryCard
          label="Compromissos agendados"
          value={valor(carga === "pronta", compromissosAgendados(compromissos, hojeLocal()))}
          sub="Agenda de hoje em diante"
        />
        <SummaryCard label="Atendimentos na semana" value="—" sub={PROXIMA_ETAPA} />
        <SummaryCard label="Encontros realizados" value="—" sub={PROXIMA_ETAPA} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ProximosCompromissos />
        <div className="lg:col-span-2">
          <EmBreve
            titulo="Próximas chamadas de atividade"
            texto={`${PROXIMA_ETAPA}: encontros e registro de frequência.`}
          />
        </div>
      </div>

      <PainelDoPerfil />
    </div>
  )
}
