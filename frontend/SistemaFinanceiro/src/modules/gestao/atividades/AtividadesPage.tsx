import { type FormEvent, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  useEducandosGestao,
  useSalvarGestao,
} from "../educandos/EducandosContext"
import {
  Badge,
  Card,
  Field,
  PageHeader,
  SaveStatus,
  inputClass,
  textareaClass,
} from "../educandos/components/EducandoUi"
import type { Atividade, SituacaoAtividade } from "../educandos/types"
import {
  atividadeVazia,
  contarEncontros,
  filtrarAtividades,
  novoIdAtividade,
  permissoesAtividades,
} from "./model"

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50"
const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
const actionButton =
  "rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1a3a6b] transition-colors hover:bg-[var(--muted)]"

export default function AtividadesPage() {
  const { user } = useAuth()
  const { atividades, encontros, iniciativas, iniciativaNome, salvarAtividade } =
    useEducandosGestao()
  const { registrarAtividade } = permissoesAtividades(user?.perfil)
  const { estado, salvar, mensagem } = useSalvarGestao()

  const [busca, setBusca] = useState("")
  const [iniciativa, setIniciativa] = useState("todas")
  const [situacao, setSituacao] = useState("todas")
  const lista = filtrarAtividades(atividades, busca, iniciativa, situacao)

  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState<Atividade>(() => atividadeVazia())

  const abrirNova = () => {
    setForm(atividadeVazia(user?.nome ?? ""))
    setAberto(true)
  }

  const abrirEdicao = (atividade: Atividade) => {
    setForm(atividade)
    setAberto(true)
  }

  const submeter = async (event: FormEvent) => {
    event.preventDefault()
    const registro = form.id ? form : { ...form, id: novoIdAtividade() }
    const ok = await salvar(() => salvarAtividade(registro))
    if (ok) setAberto(false)
  }

  return (
    <div>
      <PageHeader
        titulo="Atividades e Frequência"
        descricao="Oficinas e ações coletivas vinculadas às iniciativas da MDCA."
        acoes={
          registrarAtividade ? (
            <>
              <SaveStatus estado={estado} />
              <button type="button" className={primaryButton} onClick={abrirNova}>
                + Nova atividade
              </button>
            </>
          ) : undefined
        }
      />

      {registrarAtividade && aberto && (
        <Card className="mb-5 p-5">
          <form onSubmit={submeter} className="space-y-4">
            <h2 className="text-base font-semibold">
              {form.id ? "Editar atividade" : "Nova atividade"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome da atividade">
                <input
                  required
                  className={inputClass}
                  value={form.nome}
                  onChange={(event) =>
                    setForm({ ...form, nome: event.target.value })
                  }
                />
              </Field>
              <Field label="Responsável">
                <input
                  required
                  className={inputClass}
                  value={form.responsavel}
                  onChange={(event) =>
                    setForm({ ...form, responsavel: event.target.value })
                  }
                />
              </Field>
              <Field label="Projeto / Serviço / Programa">
                <select
                  required
                  className={inputClass}
                  value={form.iniciativaId}
                  onChange={(event) =>
                    setForm({ ...form, iniciativaId: event.target.value })
                  }
                >
                  <option value="">Selecione</option>
                  {iniciativas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} · {item.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Situação">
                <select
                  className={inputClass}
                  value={form.situacao}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      situacao: event.target.value as SituacaoAtividade,
                    })
                  }
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Encerrada">Encerrada</option>
                </select>
              </Field>
              <Field label="Descrição" full>
                <textarea
                  rows={2}
                  className={textareaClass}
                  value={form.descricao}
                  onChange={(event) =>
                    setForm({ ...form, descricao: event.target.value })
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
                Salvar atividade
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setAberto(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-64 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            ⌕
          </span>
          <input
            className={`${inputClass} pl-9`}
            placeholder="Buscar por atividade ou responsável"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
        <select
          className={`${inputClass} w-full md:w-72`}
          value={iniciativa}
          onChange={(event) => setIniciativa(event.target.value)}
          aria-label="Filtrar por iniciativa"
        >
          <option value="todas">Todas as iniciativas</option>
          {iniciativas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} w-full md:w-44`}
          value={situacao}
          onChange={(event) => setSituacao(event.target.value)}
          aria-label="Filtrar por situação"
        >
          <option value="todas">Todas as situações</option>
          <option value="Ativa">Ativas</option>
          <option value="Encerrada">Encerradas</option>
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Atividade</th>
                <th className="px-4 py-3 font-medium">Iniciativa vinculada</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Encontros</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                {registrarAtividade && (
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {lista.map((atividade) => (
                <tr
                  key={atividade.id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{atividade.nome}</p>
                    {atividade.descricao && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {atividade.descricao}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {iniciativaNome(atividade.iniciativaId)}
                  </td>
                  <td className="px-4 py-3">{atividade.responsavel}</td>
                  <td className="px-4 py-3">
                    {contarEncontros(encontros, atividade.id)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        atividade.situacao === "Ativa" ? "default" : "secondary"
                      }
                    >
                      {atividade.situacao}
                    </Badge>
                  </td>
                  {registrarAtividade && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className={actionButton}
                        onClick={() => abrirEdicao(atividade)}
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td
                    colSpan={registrarAtividade ? 6 : 5}
                    className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                  >
                    Nenhuma atividade encontrada com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
