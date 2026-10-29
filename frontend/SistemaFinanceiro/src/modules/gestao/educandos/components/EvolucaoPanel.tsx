import { useState, type FormEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import { ErrorState, LoadingState } from "@/components/StatusMessage"
import { CAMPOS_AGUARDANDO_MIGRACAO } from "../../api/educandosMapper"
import { usePermissoesEducandos, useSalvarGestao } from "../EducandosContext"
import { nomePerfil, situacaoAtualEncaminhamento } from "../model"
import type {
  Atendimento,
  Encaminhamento,
  StatusEncaminhamento,
} from "../types"
import { useEvolucoesEducando } from "../useEvolucoesEducando"
import { useRascunho } from "../useRascunho"
import {
  Badge,
  Card,
  Field,
  SaveStatus,
  SensitiveNote,
  inputClass,
  textareaClass,
} from "./EducandoUi"

const primaryButton =
  "inline-flex h-9 items-center rounded-md bg-[#0f1e3d] px-3 text-sm font-medium text-white hover:bg-[#1a3060] disabled:opacity-50"
// Campos sem coluna no banco até a migration da Sprint 3 ser aplicada.
const pendente = CAMPOS_AGUARDANDO_MIGRACAO
const AVISO_PENDENTE =
  "Ainda não é salvo no servidor: aguardando a migration da Sprint 3."

type FormAcompanhamento = {
  data: string
  situacao: StatusEncaminhamento
  observacao: string
}

const secondaryButton =
  "inline-flex h-9 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium hover:bg-[var(--muted)]"

function formatarDataHora(valor: string): string {
  const [data, hora] = valor.split("T")
  return `${(data ?? "").split("-").reverse().join("/")}${
    hora ? ` às ${hora.slice(0, 5)}` : ""
  }`
}

function AtendimentoCard({
  atendimento,
  podeVerSigiloso,
}: {
  atendimento: Atendimento
  podeVerSigiloso: boolean
}) {
  const oculto = atendimento.sigiloso && !podeVerSigiloso
  return (
    <Card className="relative p-4">
      <span className="absolute -left-[27px] top-6 size-3 rounded-full bg-[#0e7e6e]" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary">Atendimento</Badge>
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatarDataHora(atendimento.dataHora)}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium">
        {atendimento.profissional}{" "}
        {atendimento.perfilProfissional && (
          <span className="text-xs font-normal text-[var(--muted-foreground)]">
            ({atendimento.perfilProfissional})
          </span>
        )}
      </p>
      {oculto ? (
        <div className="mt-3">
          <SensitiveNote>
            Conteúdo sigiloso — restrito à equipe técnica e à coordenação.
          </SensitiveNote>
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          <p>{atendimento.registro}</p>
          <p>
            <strong className="text-[var(--muted-foreground)]">
              Com o usuário:
            </strong>{" "}
            {atendimento.intervencaoUsuario || "—"}
          </p>
          <p>
            <strong className="text-[var(--muted-foreground)]">
              Com a família:
            </strong>{" "}
            {atendimento.intervencaoFamilia || "—"}
          </p>
          {atendimento.sigiloso && <Badge variant="outline">Sigiloso</Badge>}
        </div>
      )}
    </Card>
  )
}

function EncaminhamentoCard({
  encaminhamento,
  onAcompanhar,
}: {
  encaminhamento: Encaminhamento
  onAcompanhar: (form: FormAcompanhamento) => Promise<void>
}) {
  const { estado, mensagem, salvar } = useSalvarGestao()
  const [formAberto, setFormAberto] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const situacao = situacaoAtualEncaminhamento(encaminhamento)
  const [form, setForm] = useState<FormAcompanhamento>({
    data: new Date().toISOString().slice(0, 10),
    situacao,
    observacao: "",
  })
  const historico = [...encaminhamento.acompanhamentos].sort((a, b) =>
    a.data.localeCompare(b.data),
  )

  const gravar = async (event: FormEvent) => {
    event.preventDefault()
    const ok = await salvar(() => onAcompanhar(form))
    if (ok) {
      setForm({ ...form, observacao: "" })
      setFormAberto(false)
      setHistoricoAberto(true)
    }
  }

  return (
    <Card className="relative p-4">
      <span className="absolute -left-[27px] top-6 size-3 rounded-full bg-[#1a3a6b]" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Encaminhamento</Badge>
          <Badge
            variant={
              situacao === "Efetivado"
                ? "default"
                : situacao === "Pendente"
                  ? "danger"
                  : "secondary"
            }
          >
            {situacao}
          </Badge>
          {historico.length > 0 && (
            <button
              type="button"
              className="text-xs text-[#1a3a6b] hover:underline"
              onClick={() => setHistoricoAberto((atual) => !atual)}
            >
              {historicoAberto ? "Ocultar histórico" : "Ver histórico"}
            </button>
          )}
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatarDataHora(encaminhamento.dataHora)}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium">
        {encaminhamento.destino || "Destino não informado"}
      </p>
      {encaminhamento.motivo && (
        <p className="text-sm text-[var(--muted-foreground)]">
          {encaminhamento.motivo}
        </p>
      )}
      {encaminhamento.profissional && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Registrado por {encaminhamento.profissional}
        </p>
      )}

      {historicoAberto && (
        <ul className="mt-3 space-y-2 border-l border-dashed border-[var(--border)] pl-4">
          {historico.map((item) => (
            <li key={item.id} className="text-sm">
              <span className="text-xs text-[var(--muted-foreground)]">
                {item.data.split("-").reverse().join("/")} · {item.situacao}
              </span>
              <p>{item.observacao}</p>
            </li>
          ))}
        </ul>
      )}

      {formAberto ? (
        <form
          onSubmit={gravar}
          className="mt-3 space-y-3 rounded-lg bg-[var(--muted)] p-3"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Data do acompanhamento">
              <input
                type="date"
                className={inputClass}
                value={form.data}
                onChange={(event) =>
                  setForm({ ...form, data: event.target.value })
                }
              />
            </Field>
            <Field label="Situação">
              <select
                className={inputClass}
                value={form.situacao}
                onChange={(event) =>
                  setForm({
                    ...form,
                    situacao: event.target.value as StatusEncaminhamento,
                  })
                }
              >
                <option>Pendente</option>
                <option>Em andamento</option>
                <option>Efetivado</option>
              </select>
            </Field>
          </div>
          <Field label="Observações">
            <textarea
              rows={2}
              required
              className={textareaClass}
              value={form.observacao}
              onChange={(event) =>
                setForm({ ...form, observacao: event.target.value })
              }
            />
          </Field>
          <p className="text-xs text-[var(--muted-foreground)]">
            O destino e o motivo originais permanecem. Este registro é
            acrescentado ao histórico.
          </p>
          {mensagem && <p className="text-sm text-red-600">{mensagem}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button className={primaryButton} disabled={estado === "saving"}>
              Registrar acompanhamento
            </button>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => setFormAberto(false)}
            >
              Cancelar
            </button>
            <SaveStatus estado={estado} />
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-[#1a3a6b] hover:underline"
          onClick={() => setFormAberto(true)}
        >
          Registrar acompanhamento
        </button>
      )}
    </Card>
  )
}

export default function EvolucaoPanel({ educandoId }: { educandoId: string }) {
  const { user } = useAuth()
  const permissoes = usePermissoesEducandos()
  const {
    atendimentos,
    encaminhamentos,
    carga,
    erro,
    recarregar,
    registrarAtendimento,
    registrarEncaminhamento,
    registrarAcompanhamento,
  } = useEvolucoesEducando(educandoId, permissoes.verEvolucao)
  const { estado, mensagem, salvar } = useSalvarGestao()
  const [novoAtendimento, setNovoAtendimento] = useState(false)
  const [novoEncaminhamento, setNovoEncaminhamento] = useState(false)
  const [form, setForm, limparForm] = useRascunho(
    `rascunho:gestao:evolucao:${educandoId}`,
    {
      dataHora: new Date().toISOString().slice(0, 16),
      registro: "",
      intervencaoUsuario: "",
      intervencaoFamilia: "",
      sigiloso: true,
    },
  )
  const [formEnc, setFormEnc, limparEnc] = useRascunho(
    `rascunho:gestao:encaminhamento:${educandoId}`,
    { destino: "", motivo: "" },
  )

  if (!permissoes.verEvolucao) {
    return (
      <SensitiveNote>
        As fichas de evolução não estão disponíveis para este perfil.
      </SensitiveNote>
    )
  }

  const linha = [
    ...atendimentos
      .filter((item) => item.educandoId === educandoId)
      .map((item) => ({
        tipo: "atendimento" as const,
        data: item.dataHora,
        item,
      })),
    ...encaminhamentos
      .filter((item) => item.educandoId === educandoId)
      .map((item) => ({
        tipo: "encaminhamento" as const,
        data: item.dataHora,
        item,
      })),
  ].sort((a, b) => b.data.localeCompare(a.data))

  const salvarAtendimento = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    const ok = await salvar(() => registrarAtendimento(form))
    if (ok) {
      limparForm()
      setForm({
        ...form,
        registro: "",
        intervencaoUsuario: "",
        intervencaoFamilia: "",
      })
      setNovoAtendimento(false)
    }
  }

  const salvarEncaminhamento = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    const ok = await salvar(() => registrarEncaminhamento(formEnc))
    if (ok) {
      limparEnc()
      setFormEnc({ destino: "", motivo: "" })
      setNovoEncaminhamento(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={primaryButton}
          onClick={() => setNovoAtendimento((atual) => !atual)}
        >
          + Novo atendimento
        </button>
        <button
          className={`${secondaryButton} disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={() => setNovoEncaminhamento((atual) => !atual)}
          disabled={pendente}
          title={pendente ? "Destino e motivo dependem da migration da Sprint 3." : undefined}
        >
          + Novo encaminhamento
        </button>
        <SaveStatus estado={estado} />
      </div>
      {pendente && (
        <p className="text-xs text-[var(--muted-foreground)]">
          Novos encaminhamentos ficam disponíveis quando a migration da Sprint
          3 for aplicada (destino, motivo e profissional ainda não têm coluna
          no banco). Os acompanhamentos dos encaminhamentos existentes já
          funcionam.
        </p>
      )}
      {mensagem && <SensitiveNote>{mensagem}</SensitiveNote>}

      {novoAtendimento && (
        <Card className="p-5">
          <form onSubmit={salvarAtendimento} className="space-y-4">
            <h3 className="font-semibold">Registrar atendimento</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Profissional responsável: {user?.nome} (
              {user ? nomePerfil(user.perfil) : ""}). O registro usa o usuário
              autenticado.
            </p>
            <Field label="Data e hora">
              <input
                type="datetime-local"
                className={inputClass}
                value={form.dataHora}
                onChange={(event) =>
                  setForm({ ...form, dataHora: event.target.value })
                }
              />
            </Field>
            <Field label="Registro do atendimento">
              <textarea
                rows={3}
                required
                className={textareaClass}
                value={form.registro}
                onChange={(event) =>
                  setForm({ ...form, registro: event.target.value })
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Intervenções com o usuário">
                <textarea
                  rows={3}
                  className={textareaClass}
                  value={form.intervencaoUsuario}
                  disabled={pendente}
                  onChange={(event) =>
                    setForm({ ...form, intervencaoUsuario: event.target.value })
                  }
                />
              </Field>
              <Field label="Intervenções com a família">
                <textarea
                  rows={3}
                  className={textareaClass}
                  value={form.intervencaoFamilia}
                  disabled={pendente}
                  onChange={(event) =>
                    setForm({ ...form, intervencaoFamilia: event.target.value })
                  }
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={pendente}
                checked={form.sigiloso}
                onChange={(event) =>
                  setForm({ ...form, sigiloso: event.target.checked })
                }
              />
              Marcar conteúdo como sigiloso (restrito à equipe técnica e
              coordenação)
            </label>
            {pendente && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Intervenções e sigilo: {AVISO_PENDENTE.toLowerCase()}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button className={primaryButton} disabled={estado === "saving"}>
                Salvar atendimento
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setNovoAtendimento(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {novoEncaminhamento && (
        <Card className="p-5">
          <form onSubmit={salvarEncaminhamento} className="space-y-4">
            <h3 className="font-semibold">Registrar encaminhamento</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Registrado por {user?.nome}.
            </p>
            <Field label="Destino / serviço da rede">
              <input
                required
                className={inputClass}
                value={formEnc.destino}
                onChange={(event) =>
                  setFormEnc({ ...formEnc, destino: event.target.value })
                }
              />
            </Field>
            <Field label="Motivo">
              <textarea
                rows={2}
                className={textareaClass}
                value={formEnc.motivo}
                onChange={(event) =>
                  setFormEnc({ ...formEnc, motivo: event.target.value })
                }
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <button className={primaryButton} disabled={estado === "saving"}>
                Salvar encaminhamento
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setNovoEncaminhamento(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {carga === "carregando" && <LoadingState label="Carregando linha do tempo…" />}
      {carga === "erro" && (
        <div className="space-y-2">
          <ErrorState message={erro ?? "Não foi possível carregar a linha do tempo."} />
          <button
            type="button"
            onClick={recarregar}
            className="text-sm text-[#1a3a6b] hover:underline"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {carga === "pronta" && (
      <div className="space-y-4 border-l-2 border-[var(--border)] pl-5">
        {linha.map((registro) =>
          registro.tipo === "atendimento" ? (
            <AtendimentoCard
              key={registro.item.id}
              atendimento={registro.item}
              podeVerSigiloso={permissoes.verSaude}
            />
          ) : (
            <EncaminhamentoCard
              key={registro.item.id}
              encaminhamento={registro.item}
              onAcompanhar={(dados) =>
                registrarAcompanhamento(registro.item.id, dados)
              }
            />
          ),
        )}
        {linha.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Nenhum registro na linha do tempo deste educando.
          </p>
        )}
      </div>
      )}
    </div>
  )
}
