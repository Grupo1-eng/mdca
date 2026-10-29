import { useAuth } from "@/context/AuthContext"
import {
  atividadesGestao,
  atendimentosGestao,
  compromissosGestao,
  educandosGestao,
  encaminhamentosGestao,
  encontrosGestao,
  iniciativasGestao,
  situacaoAtualEncaminhamento,
} from "@/lib/gestaoDashboardData"

function inicioSemana() {
  const data = new Date()
  data.setDate(data.getDate() - 7)
  return data
}

function formatarData(data: string) {
  return data.split("-").reverse().join("/")
}

function Badge({
  children,
  destaque = false,
}: {
  children: React.ReactNode
  destaque?: boolean
}) {
  return (
    <span
      className={`inline-flex text-[10px] font-mono font-medium px-2 py-1 rounded ${
        destaque
          ? "bg-red-50 text-red-600"
          : "bg-[var(--secondary)] text-[var(--secondary-foreground)]"
      }`}
    >
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
  value: number
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

function ProximosCompromissos() {
  const hoje = new Date().toISOString().slice(0, 10)
  const proximos = compromissosGestao
    .filter(
      (compromisso) =>
        compromisso.status === "Agendado" && compromisso.data >= hoje,
    )
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 3)

  return (
    <section className="bg-white rounded-lg border border-[var(--border)] p-5">
      <h2 className="font-semibold text-sm text-[var(--foreground)]">
        Próximos compromissos
      </h2>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-4">
        Agenda da equipe nos próximos dias.
      </p>
      <ul className="space-y-3">
        {proximos.map((compromisso) => (
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
              {formatarData(compromisso.data)} às {compromisso.horario} ·{" "}
              {compromisso.local}
            </p>
          </li>
        ))}
        {proximos.length === 0 && (
          <li className="text-sm text-[var(--muted-foreground)]">
            Nenhum compromisso agendado.
          </li>
        )}
      </ul>
    </section>
  )
}

function ProximasChamadas() {
  const hoje = new Date().toISOString().slice(0, 10)
  const proximos = encontrosGestao
    .filter(
      (encontro) => encontro.situacao === "Planejado" && encontro.data >= hoje,
    )
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 4)

  return (
    <section className="bg-white rounded-lg border border-[var(--border)] p-5">
      <h2 className="font-semibold text-sm text-[var(--foreground)]">
        Próximas chamadas de atividade
      </h2>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-4">
        Encontros planejados — a frequência será registrada no dia.
      </p>
      <ul className="space-y-3">
        {proximos.map((encontro) => {
          const atividade = atividadesGestao.find(
            (item) => item.id === encontro.atividadeId,
          )
          const iniciativa = iniciativasGestao.find(
            (item) => item.id === atividade?.iniciativaId,
          )
          return (
            <li
              key={encontro.id}
              className="rounded-lg border border-[var(--border)] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {atividade?.nome ?? "Atividade"}
                </p>
                <Badge>{encontro.presencas.length} educandos</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {formatarData(encontro.data)} às {encontro.horario} ·{" "}
                {encontro.local}
                {iniciativa ? ` · ${iniciativa.nome}` : ""}
              </p>
            </li>
          )
        })}
        {proximos.length === 0 && (
          <li className="text-sm text-[var(--muted-foreground)]">
            Nenhum encontro planejado.
          </li>
        )}
      </ul>
    </section>
  )
}

function PainelTecnico() {
  const nomeEducando = (id: string) =>
    educandosGestao.find((item) => item.id === id)?.nome ?? "—"
  const abertos = encaminhamentosGestao
    .filter((item) => situacaoAtualEncaminhamento(item) !== "Efetivado")
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
    .slice(0, 4)
  const recentes = [...atendimentosGestao]
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
    .slice(0, 4)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="bg-white rounded-lg border border-[var(--border)] p-5">
        <h2 className="font-semibold text-sm">Encaminhamentos em aberto</h2>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-4">
          Casos aguardando acompanhamento.
        </p>
        <ul className="space-y-3">
          {abertos.map((item) => {
            const situacao = situacaoAtualEncaminhamento(item)
            return (
              <li
                key={item.id}
                className="rounded-lg border border-[var(--border)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {nomeEducando(item.educandoId)}
                  </p>
                  <Badge destaque={situacao === "Pendente"}>{situacao}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {item.destino} · aberto em{" "}
                  {formatarData(item.dataHora.slice(0, 10))}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="bg-white rounded-lg border border-[var(--border)] p-5">
        <h2 className="font-semibold text-sm mb-4">
          Últimos atendimentos registrados
        </h2>
        <ul className="space-y-3">
          {recentes.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap justify-between gap-2 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0 text-sm"
            >
              <span>{nomeEducando(item.educandoId)}</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {item.profissional} · {formatarData(item.dataHora.slice(0, 10))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function PainelAdministrativo() {
  const semDocumento = educandosGestao.filter(
    (item) => !item.cpf.trim() || !item.nis.trim(),
  ).length

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="bg-white rounded-lg border border-[var(--border)] p-5">
        <h2 className="font-semibold text-sm mb-4">
          Educandos por projeto, serviço ou programa
        </h2>
        <ul className="space-y-3">
          {iniciativasGestao.map((iniciativa) => {
            const ativos = educandosGestao.filter(
              (educando) =>
                educando.iniciativaId === iniciativa.id &&
                educando.situacaoVinculo === "Ativo",
            ).length
            return (
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
            )
          })}
        </ul>
      </section>

      <section className="bg-white rounded-lg border border-[var(--border)] p-5">
        <h2 className="font-semibold text-sm">Pendências cadastrais</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {semDocumento === 0
            ? "Todos os cadastros possuem CPF e NIS informados."
            : `${semDocumento} cadastro(s) sem CPF ou NIS informado.`}
        </p>
      </section>
    </div>
  )
}

function PainelCoordenacao() {
  const limite = inicioSemana()
  const linhas = iniciativasGestao.map((iniciativa) => {
    const ids = educandosGestao
      .filter((item) => item.iniciativaId === iniciativa.id)
      .map((item) => item.id)
    const ativos = educandosGestao.filter(
      (item) =>
        item.iniciativaId === iniciativa.id && item.situacaoVinculo === "Ativo",
    ).length
    const encontros = encontrosGestao.filter((encontro) =>
      atividadesGestao.some(
        (atividade) =>
          atividade.id === encontro.atividadeId &&
          atividade.iniciativaId === iniciativa.id,
      ),
    )
    const realizados = encontros.filter((item) => item.situacao === "Realizado")
    const presencas = realizados.flatMap((item) => item.presencas)
    const frequencia = presencas.length
      ? Math.round(
          (presencas.filter((item) => item.presente).length /
            presencas.length) *
            100,
        )
      : 0
    const atendimentos = atendimentosGestao.filter(
      (item) =>
        ids.includes(item.educandoId) && new Date(item.dataHora) >= limite,
    ).length
    return {
      iniciativa,
      ativos,
      realizados: realizados.length,
      frequencia,
      atendimentos,
    }
  })

  return (
    <section className="bg-white rounded-lg border border-[var(--border)] p-5">
      <h2 className="font-semibold text-sm">
        Desempenho por projeto, serviço ou programa
      </h2>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-4">
        Métricas para leitura da coordenação; atendimentos referem-se à semana.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
              <th className="pb-2 pr-4 font-medium">Iniciativa</th>
              <th className="pb-2 pr-4 font-medium">Educandos ativos</th>
              <th className="pb-2 pr-4 font-medium">Encontros realizados</th>
              <th className="pb-2 pr-4 font-medium">Frequência média</th>
              <th className="pb-2 font-medium">Atendimentos</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr
                key={linha.iniciativa.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="py-3 pr-4">
                  <span className="font-medium">{linha.iniciativa.nome}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">
                    {linha.iniciativa.tipo} · {linha.iniciativa.situacao}
                  </span>
                </td>
                <td className="py-3 pr-4">{linha.ativos}</td>
                <td className="py-3 pr-4">{linha.realizados}</td>
                <td className="py-3 pr-4">{linha.frequencia}%</td>
                <td className="py-3">{linha.atendimentos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PainelDoPerfil() {
  const { user } = useAuth()

  if (
    user?.perfil === "tecnico_servico_social" ||
    user?.perfil === "tecnico_psicologia"
  ) {
    return <PainelTecnico />
  }
  if (user?.perfil === "administrativo") return <PainelAdministrativo />
  if (user?.perfil === "educador") return null
  return <PainelCoordenacao />
}

export default function GestaoDashboard() {
  const limite = inicioSemana()
  const hoje = new Date().toISOString().slice(0, 10)
  const ativos = educandosGestao.filter(
    (item) => item.situacaoVinculo === "Ativo",
  ).length
  const atendimentosSemana = atendimentosGestao.filter(
    (item) => new Date(item.dataHora) >= limite,
  ).length
  const encontrosSemana = encontrosGestao.filter(
    (item) => item.situacao === "Realizado" && new Date(item.data) >= limite,
  ).length
  const compromissosAgendados = compromissosGestao.filter(
    (item) => item.status === "Agendado" && item.data >= hoje,
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[var(--foreground)]">
          Visão geral
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Panorama da semana no atendimento a crianças e adolescentes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Educandos ativos"
          value={ativos}
          sub="Vínculos ativos na organização"
        />
        <SummaryCard
          label="Atendimentos na semana"
          value={atendimentosSemana}
          sub="Registros dos últimos sete dias"
        />
        <SummaryCard
          label="Encontros realizados na semana"
          value={encontrosSemana}
          sub="Atividades concluídas no período"
        />
        <SummaryCard
          label="Compromissos agendados"
          value={compromissosAgendados}
          sub="Agenda atual e futura"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ProximosCompromissos />
        <div className="lg:col-span-2">
          <ProximasChamadas />
        </div>
      </div>

      <PainelDoPerfil />
    </div>
  )
}
