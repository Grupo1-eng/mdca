import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useSalvarGestao } from "@/modules/gestao/educandos/EducandosContext"
import {
  Badge,
  Card,
  Field,
  PageHeader,
  SaveStatus,
  inputClass,
  textareaClass,
} from "@/modules/gestao/educandos/components/EducandoUi"
import { useAgendaGestao } from "./AgendaContext"
import { dataRelativa } from "./data/mock"
import {
  compromissosDaVisao,
  navegarPeriodo,
  novoIdCompromisso,
  rotuloPeriodo,
} from "./model"
import type {
  Compromisso,
  DadosEditaveisCompromisso,
  TipoCompromisso,
  VisaoAgenda,
} from "./types"

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50"
const secondaryButton =
  "inline-flex h-9 items-center justify-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
const actionButton =
  "rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1a3a6b] transition-colors hover:bg-[var(--muted)] disabled:opacity-50"

const tipos: TipoCompromisso[] = [
  "Atendimento",
  "Reunião",
  "Visita domiciliar",
  "Encontro de atividade",
]

interface FormCompromisso extends DadosEditaveisCompromisso {
  responsavel: string
}

function formularioVazio(data: string, responsavel: string): FormCompromisso {
  return {
    titulo: "",
    data,
    horario: "09:00",
    local: "",
    responsavel,
    tipo: "Atendimento",
    observacoes: "",
  }
}

function formatarData(data: string): string {
  return data.split("-").reverse().join("/")
}

export default function AgendaPage() {
  const { user } = useAuth()
  const {
    compromissos,
    criarCompromisso,
    editarCompromisso,
    mudarStatusCompromisso,
  } = useAgendaGestao()
  const { estado, salvar, mensagem } = useSalvarGestao()
  const hoje = dataRelativa(0)
  const [visao, setVisao] = useState<VisaoAgenda>("semana")
  const [referencia, setReferencia] = useState(hoje)
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState<FormCompromisso>(() =>
    formularioVazio(hoje, user?.nome ?? ""),
  )

  const lista = compromissosDaVisao(compromissos, referencia, visao)

  const abrirNovo = () => {
    setEditando(null)
    setForm(formularioVazio(referencia, user?.nome ?? ""))
    setAberto(true)
  }

  const abrirEdicao = (compromisso: Compromisso) => {
    setEditando(compromisso.id)
    setForm({
      titulo: compromisso.titulo,
      data: compromisso.data,
      horario: compromisso.horario,
      local: compromisso.local,
      responsavel: compromisso.responsavel,
      tipo: compromisso.tipo,
      observacoes: compromisso.observacoes,
    })
    setAberto(true)
  }

  const fecharFormulario = () => {
    setAberto(false)
    setEditando(null)
  }

  const submeter = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const dados: DadosEditaveisCompromisso = {
      titulo: form.titulo,
      data: form.data,
      horario: form.horario,
      local: form.local,
      tipo: form.tipo,
      observacoes: form.observacoes,
    }
    const ok = await salvar(() => {
      if (editando) {
        editarCompromisso(editando, dados)
        return
      }
      criarCompromisso({
        id: novoIdCompromisso(),
        ...dados,
        responsavel: user.nome,
        status: "Agendado",
      })
    })

    if (ok) fecharFormulario()
  }

  const mudarStatus = (
    compromisso: Compromisso,
    status: Compromisso["status"],
  ) => salvar(() => mudarStatusCompromisso(compromisso.id, status))

  return (
    <div>
      <PageHeader
        titulo="Agenda"
        descricao="Compromissos da equipe. Registros cancelados permanecem no histórico."
        acoes={
          <div className="flex items-center gap-3">
            <SaveStatus estado={estado} />
            <button type="button" className={primaryButton} onClick={abrirNovo}>
              + Novo compromisso
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-md bg-[var(--muted)] p-1"
          aria-label="Visualização da Agenda"
        >
          {(["dia", "semana", "mes"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={visao === item}
              onClick={() => setVisao(item)}
              className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                visao === item
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {item === "dia" ? "Dia" : item === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={secondaryButton}
            onClick={() =>
              setReferencia((atual) => navegarPeriodo(atual, visao, -1))
            }
          >
            ← Anterior
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => setReferencia(hoje)}
          >
            Hoje
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={() =>
              setReferencia((atual) => navegarPeriodo(atual, visao, 1))
            }
          >
            Próximo →
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm font-medium capitalize text-[var(--muted-foreground)]">
        {rotuloPeriodo(referencia, visao)}
      </p>

      {aberto && (
        <Card className="mb-5 p-5">
          <form onSubmit={submeter} className="space-y-4">
            <h2 className="text-base font-semibold">
              {editando ? "Editar compromisso" : "Novo compromisso"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título" full>
                <input
                  required
                  className={inputClass}
                  value={form.titulo}
                  onChange={(event) =>
                    setForm({ ...form, titulo: event.target.value })
                  }
                />
              </Field>
              <Field label="Data">
                <input
                  required
                  type="date"
                  className={inputClass}
                  value={form.data}
                  onChange={(event) =>
                    setForm({ ...form, data: event.target.value })
                  }
                />
              </Field>
              <Field label="Horário">
                <input
                  type="time"
                  className={inputClass}
                  value={form.horario}
                  onChange={(event) =>
                    setForm({ ...form, horario: event.target.value })
                  }
                />
              </Field>
              <Field label="Local">
                <input
                  className={inputClass}
                  value={form.local}
                  onChange={(event) =>
                    setForm({ ...form, local: event.target.value })
                  }
                />
              </Field>
              <Field label="Responsável">
                <input
                  className={inputClass}
                  value={form.responsavel}
                  disabled
                />
              </Field>
              <Field label="Tipo">
                <select
                  className={inputClass}
                  value={form.tipo}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      tipo: event.target.value as TipoCompromisso,
                    })
                  }
                >
                  {tipos.map((tipo) => (
                    <option key={tipo}>{tipo}</option>
                  ))}
                </select>
              </Field>
              <Field label="Observações" full>
                <textarea
                  rows={2}
                  className={textareaClass}
                  value={form.observacoes}
                  onChange={(event) =>
                    setForm({ ...form, observacoes: event.target.value })
                  }
                />
              </Field>
            </div>
            {mensagem && <p className="text-sm text-red-600">{mensagem}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className={primaryButton}
                disabled={estado === "saving"}
              >
                Salvar compromisso
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={fecharFormulario}
              >
                Cancelar
              </button>
              <SaveStatus estado={estado} />
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {lista.map((compromisso) => {
          const doDia = compromisso.data === hoje
          return (
            <Card
              key={compromisso.id}
              className={`flex flex-wrap items-center justify-between gap-3 p-4 ${
                doDia ? "border-[#0e7e6e] bg-[#0e7e6e]/5" : ""
              } ${compromisso.status === "Cancelado" ? "opacity-70" : ""}`}
            >
              <div className="min-w-64 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {compromisso.titulo}
                  {doDia && <Badge variant="outline">Hoje</Badge>}
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {formatarData(compromisso.data)} às {compromisso.horario} ·{" "}
                  {compromisso.local || "sem local"} ·{" "}
                  {compromisso.responsavel || "sem responsável"}
                </p>
                {compromisso.observacoes && (
                  <p className="mt-1 text-xs">{compromisso.observacoes}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant="secondary">{compromisso.tipo}</Badge>
                <Badge
                  variant={
                    compromisso.status === "Cancelado"
                      ? "danger"
                      : compromisso.status === "Realizado"
                        ? "default"
                        : "outline"
                  }
                >
                  {compromisso.status}
                </Badge>
                <button
                  type="button"
                  className={actionButton}
                  disabled={estado === "saving"}
                  onClick={() => abrirEdicao(compromisso)}
                >
                  Editar
                </button>
                {compromisso.status === "Agendado" && (
                  <>
                    <button
                      type="button"
                      className={actionButton}
                      disabled={estado === "saving"}
                      onClick={() => mudarStatus(compromisso, "Realizado")}
                    >
                      Marcar realizado
                    </button>
                    <button
                      type="button"
                      className={`${actionButton} text-red-600`}
                      disabled={estado === "saving"}
                      onClick={() => mudarStatus(compromisso, "Cancelado")}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </Card>
          )
        })}

        {lista.length === 0 && (
          <Card className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            Nenhum compromisso nesta visualização.
          </Card>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link to="/gestao" className="text-[#1a3a6b] hover:underline">
          ← Voltar ao Dashboard
        </Link>
        <Link to="/gestao/educandos" className="text-[#1a3a6b] hover:underline">
          Ir para Educandos →
        </Link>
      </div>
    </div>
  )
}
