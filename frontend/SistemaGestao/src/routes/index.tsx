import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CalendarDays, ClipboardList, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { situacaoAtualEncaminhamento } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Gestão MDCA" },
      {
        name: "description",
        content:
          "Visão geral do módulo Gestão da MDCA: educandos ativos, atendimentos, encontros e agenda da semana.",
      },
      { property: "og:title", content: "Dashboard | Gestão MDCA" },
      {
        property: "og:description",
        content: "Panorama semanal do atendimento a crianças e adolescentes na MDCA.",
      },
    ],
  }),
  component: Dashboard,
});

function inicioSemana() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

function Dashboard() {
  const { educandos, atendimentos, encontros, compromissos } = useStore();
  
  const limite = inicioSemana();
  const hoje = new Date().toISOString().slice(0, 10);

  const ativos = educandos.filter((e) => e.situacaoVinculo === "Ativo").length;
  const atendSemana = atendimentos.filter((a) => new Date(a.dataHora) >= limite).length;
  const encontrosSemana = encontros.filter(
    (e) => e.situacao === "Realizado" && new Date(e.data) >= limite,
  ).length;
  const proximos = compromissos
    .filter((c) => c.status === "Agendado" && c.data >= hoje)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 3);

  const cards = [
    { label: "Educandos ativos", valor: ativos, icone: Users },
    { label: "Atendimentos na semana", valor: atendSemana, icone: ClipboardList },
    { label: "Encontros realizados na semana", valor: encontrosSemana, icone: Activity },
    { label: "Compromissos agendados", valor: proximos.length, icone: CalendarDays },
  ];

  return (
    <div>
      <PageHeader
        titulo="Visão geral"
        descricao="Panorama da semana no atendimento a crianças e adolescentes."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icone;
          return (
            <div key={c.label} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <Icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-3xl font-semibold">{c.valor}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold">Próximos compromissos</h2>
          <ul className="space-y-3">
            {proximos.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{c.titulo}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.data.split("-").reverse().join("/")} às {c.horario} · {c.local}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {c.tipo}
                </Badge>
              </li>
            ))}
            {proximos.length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhum compromisso agendado.</li>
            )}
          </ul>
          <Link to="/agenda" className="mt-4 inline-block text-sm text-primary hover:underline">
            Ver agenda completa →
          </Link>
        </div>

        <div className="lg:col-span-2">
          <PainelPorPerfil />
        </div>
      </div>
    </div>
  );
}

function fmt(d: string) {
  return d.split("-").reverse().join("/");
}

function PainelPorPerfil() {
  const { perfil } = useStore();
  if (perfil === "educador") return <PainelEducador />;
  if (perfil === "servico_social" || perfil === "psicologia") return <PainelTecnico />;
  if (perfil === "administrativo") return <PainelAdministrativo />;
  return <PainelCoordenacao />;
}

/** Educador: foco nas próximas chamadas de atividade. */
function PainelEducador() {
  const { encontros, atividades, iniciativaNome } = useStore();
  const hoje = new Date().toISOString().slice(0, 10);
  const proximos = encontros
    .filter((e) => e.situacao === "Planejado" && e.data >= hoje)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 4);

  return (
    <section className="card-surface p-5">
      <h2 className="text-base font-semibold">Próximas chamadas de atividade</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Encontros planejados sob sua responsabilidade — registre a presença no dia.
      </p>
      <ul className="space-y-3">
        {proximos.map((e) => {
          const ativ = atividades.find((a) => a.id === e.atividadeId);
          return (
            <li key={e.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{ativ?.nome ?? "Atividade"}</p>
                <Badge variant="secondary">{e.presencas.length} educandos</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {fmt(e.data)} às {e.horario} · {e.local}
                {ativ ? ` · ${iniciativaNome(ativ.iniciativaId)}` : ""}
              </p>
              {ativ && (
                <Link
                  to="/atividades/$id"
                  params={{ id: ativ.id }}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  Abrir chamada →
                </Link>
              )}
            </li>
          );
        })}
        {proximos.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum encontro planejado.</li>
        )}
      </ul>
    </section>
  );
}

/** Serviço Social / Psicologia: encaminhamentos em aberto e atendimentos recentes. */
function PainelTecnico() {
  const { encaminhamentos, atendimentos, educandos } = useStore();
  const nome = (id: string) => educandos.find((e) => e.id === id)?.nome ?? "—";
  const abertos = encaminhamentos
    .filter((e) => situacaoAtualEncaminhamento(e) !== "Efetivado")
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
    .slice(0, 4);
  const recentes = [...atendimentos]
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
    .slice(0, 4);

  return (
    <div className="grid gap-4">
      <section className="card-surface p-5">
        <h2 className="text-base font-semibold">Encaminhamentos em aberto</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Casos pendentes ou em andamento aguardando acompanhamento.
        </p>
        <ul className="space-y-3">
          {abertos.map((e) => (
            <li key={e.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{nome(e.educandoId)}</p>
                <Badge variant={situacaoAtualEncaminhamento(e) === "Pendente" ? "destructive" : "secondary"}>
                  {situacaoAtualEncaminhamento(e)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.destino} · aberto em {fmt(e.dataHora.slice(0, 10))}
              </p>
              <Link
                to="/educandos/$id"
                params={{ id: e.educandoId }}
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Ver ficha de evolução →
              </Link>
            </li>
          ))}
          {abertos.length === 0 && (
            <li className="text-sm text-muted-foreground">Nenhum encaminhamento em aberto.</li>
          )}
        </ul>
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-3 text-base font-semibold">Últimos atendimentos registrados</h2>
        <ul className="space-y-2">
          {recentes.map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 text-sm">
              <span>{nome(a.educandoId)}</span>
              <span className="text-xs text-muted-foreground">
                {a.profissional} · {fmt(a.dataHora.slice(0, 10))}
              </span>
            </li>
          ))}
          {recentes.length === 0 && (
            <li className="text-sm text-muted-foreground">Nenhum atendimento registrado.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

/** Administrativo: distribuição de educandos e situação cadastral. */
function PainelAdministrativo() {
  const { educandos, iniciativas } = useStore();
  const semDocumento = educandos.filter((e) => !e.cpf?.trim() || !e.nis?.trim()).length;

  return (
    <div className="grid gap-4">
      <section className="card-surface p-5">
        <h2 className="mb-4 text-base font-semibold">Educandos por projeto, serviço ou programa</h2>
        <ul className="space-y-3">
          {iniciativas.map((i) => {
            const ativos = educandos.filter(
              (e) => e.iniciativaId === i.id && e.situacaoVinculo === "Ativo",
            ).length;
            return (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">
                  {i.nome} <span className="text-xs text-muted-foreground">({i.tipo})</span>
                </span>
                <Badge variant="secondary">{ativos} ativos</Badge>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-base font-semibold">Pendências cadastrais</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {semDocumento === 0
            ? "Todos os cadastros possuem CPF e NIS informados."
            : `${semDocumento} cadastro(s) sem CPF ou NIS informado.`}
        </p>
        <Link to="/educandos" className="mt-3 inline-block text-sm text-primary hover:underline">
          Revisar cadastros →
        </Link>
      </section>
    </div>
  );
}

/** Coordenação: desempenho geral das iniciativas. */
function PainelCoordenacao() {
  const { iniciativas, educandos, atividades, encontros, atendimentos } = useStore();
  const limite = inicioSemana();

  const linhas = iniciativas.map((i) => {
    const ids = educandos.filter((e) => e.iniciativaId === i.id).map((e) => e.id);
    const ativos = educandos.filter(
      (e) => e.iniciativaId === i.id && e.situacaoVinculo === "Ativo",
    ).length;
    const encs = encontros.filter((e) =>
      atividades.some((a) => a.id === e.atividadeId && a.iniciativaId === i.id),
    );
    const realizados = encs.filter((e) => e.situacao === "Realizado");
    const marcacoes = realizados.flatMap((e) => e.presencas);
    const freq = marcacoes.length
      ? Math.round((marcacoes.filter((p) => p.presente).length / marcacoes.length) * 100)
      : 0;
    const atend = atendimentos.filter(
      (a) => ids.includes(a.educandoId) && new Date(a.dataHora) >= limite,
    ).length;
    return { i, ativos, realizados: realizados.length, freq, atend };
  });

  return (
    <section className="card-surface p-5">
      <h2 className="text-base font-semibold">Desempenho por projeto, serviço ou programa</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Métricas distintas para leitura de coordenação — atendimentos referem-se à semana.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Iniciativa</th>
              <th className="pb-2 pr-3 font-medium">Educandos ativos</th>
              <th className="pb-2 pr-3 font-medium">Encontros realizados</th>
              <th className="pb-2 pr-3 font-medium">Frequência média</th>
              <th className="pb-2 font-medium">Atendimentos</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.i.id} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-3">
                  <span className="font-medium">{l.i.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {l.i.tipo} · {l.i.situacao}
                  </span>
                </td>
                <td className="py-2 pr-3">{l.ativos}</td>
                <td className="py-2 pr-3">{l.realizados}</td>
                <td className="py-2 pr-3">{l.freq}%</td>
                <td className="py-2">{l.atend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/indicadores" className="mt-4 inline-block text-sm text-primary hover:underline">
        Abrir painel de indicadores →
      </Link>
    </section>
  );
}
