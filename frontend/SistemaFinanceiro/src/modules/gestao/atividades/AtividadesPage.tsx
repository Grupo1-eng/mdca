import { type FormEvent, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ErrorState, LoadingState } from "@/components/StatusMessage"
import { useAuth } from "@/context/AuthContext"
import {
  listarAtividades,
  listarResponsaveis,
  salvarAtividadeRemota,
} from "../api/atividades"
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
import type {
  Atividade,
  ResponsavelAtividade,
  SituacaoAtividade,
} from "../educandos/types"
import {
  atividadeVazia,
  filtrarAtividades,
  permissoesAtividades,
  validarAtividade,
} from "./model"

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50"
const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
const actionButton =
  "rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1a3a6b] transition-colors hover:bg-[var(--muted)]"

export default function AtividadesPage() {
  const { user } = useAuth()
  const { iniciativas, carregarIniciativas } = useEducandosGestao()
  const { registrarAtividade } = permissoesAtividades(user?.perfil)
  const { estado, salvar, mensagem } = useSalvarGestao()

  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [responsaveis, setResponsaveis] = useState<ResponsavelAtividade[]>([])
  const [carga, setCarga] = useState<"carregando" | "pronta" | "erro">("carregando")
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const [busca, setBusca] = useState("")
  const [iniciativa, setIniciativa] = useState("todas")
  const [situacao, setSituacao] = useState("todas")
  const lista = filtrarAtividades(atividades, busca, iniciativa, situacao)

  const [form, setForm] = useState<Atividade | null>(null)
  const [erroForm, setErroForm] = useState<string | null>(null)

  useEffect(() => {
    carregarIniciativas()
    Promise.all([listarAtividades(), listarResponsaveis()])
      .then(([atividadesApi, responsaveisApi]) => {
        setAtividades(atividadesApi)
        setResponsaveis(responsaveisApi)
        setCarga("pronta")
      })
      .catch((falha: unknown) => {
        setCarga("erro")
        setErroCarga(
          falha instanceof Error ? falha.message : "Não foi possível carregar as atividades.",
        )
      })
  }, [carregarIniciativas])

  const abrirNova = () => {
    // Quem cadastra já vem como responsável, se puder ser.
    const proprio = responsaveis.some((r) => r.id === String(user?.id))
    setErroForm(null)
    setForm(atividadeVazia(proprio ? String(user?.id) : ""))
  }

  const abrirEdicao = (atividade: Atividade) => {
    setErroForm(null)
    setForm(atividade)
  }

  const submeter = (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    const problema = validarAtividade(form)
    setErroForm(problema)
    if (problema) return
    void salvar(async () => {
      await salvarAtividadeRemota(form)
      setAtividades(await listarAtividades())
      setForm(null)
    })
  }

  // Responsável que saiu da lista (inativado ou mudou de perfil) continua
  // aparecendo na edição da atividade dele.
  const opcoesResponsavel =
    form && form.responsavelId && !responsaveis.some((r) => r.id === form.responsavelId)
      ? [...responsaveis, { id: form.responsavelId, nome: `${form.responsavelNome} (indisponível)` }]
      : responsaveis

  return (
    <div>
      <PageHeader
        titulo="Atividades e Frequência"
        descricao="Oficinas e ações coletivas vinculadas às iniciativas. Abra uma atividade para agendar encontros e fazer a chamada."
        acoes={
          registrarAtividade ? (
            <>
              <SaveStatus estado={estado} />
              {mensagem && estado === "error" && (
                <span className="text-sm text-red-600">{mensagem}</span>
              )}
              <button
                type="button"
                className={primaryButton}
                onClick={abrirNova}
                disabled={carga !== "pronta"}
              >
                + Nova atividade
              </button>
            </>
          ) : undefined
        }
      />

      {carga === "carregando" && <LoadingState label="Carregando atividades" />}
      {carga === "erro" && erroCarga && <ErrorState message={erroCarga} />}

      {carga === "pronta" && (
        <>
          {registrarAtividade && form && (
            <Card className="mb-5 p-5">
              <form onSubmit={submeter} noValidate className="space-y-4">
                <h2 className="text-base font-semibold">
                  {form.id ? "Editar atividade" : "Nova atividade"}
                </h2>
                {iniciativas.length === 0 && (
                  <p className="text-sm text-amber-800">
                    Nenhuma iniciativa cadastrada. A coordenação cadastra em
                    Projetos, Serviços e Programas.
                  </p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nome da atividade">
                    <input
                      className={inputClass}
                      value={form.nome}
                      onChange={(event) => setForm({ ...form, nome: event.target.value })}
                    />
                  </Field>
                  <Field label="Responsável">
                    <select
                      className={inputClass}
                      value={form.responsavelId}
                      onChange={(event) =>
                        setForm({ ...form, responsavelId: event.target.value })
                      }
                    >
                      <option value="">Selecione</option>
                      {opcoesResponsavel.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Projeto / Serviço / Programa">
                    <select
                      className={inputClass}
                      value={form.iniciativaId}
                      onChange={(event) =>
                        setForm({ ...form, iniciativaId: event.target.value })
                      }
                    >
                      <option value="">Selecione</option>
                      {iniciativas.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
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
                {form.situacao === "Encerrada" && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Atividade encerrada não aceita encontros novos. Ela pode ser
                    reaberta depois, voltando para Ativa.
                  </p>
                )}
                {erroForm && <p className="text-sm text-red-600">{erroForm}</p>}
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
                    onClick={() => setForm(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
            <input
              className={`${inputClass} min-w-64 flex-1`}
              placeholder="Buscar por atividade ou responsável"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              aria-label="Buscar atividade"
            />
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
                    <th className="px-4 py-3 font-medium">Encontros realizados</th>
                    <th className="px-4 py-3 font-medium">Situação</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((atividade) => (
                    <tr
                      key={atividade.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/gestao/atividades/${atividade.id}`}
                          className="font-medium text-[#1a3a6b] hover:underline"
                        >
                          {atividade.nome}
                        </Link>
                        {atividade.descricao && (
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {atividade.descricao}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {atividade.iniciativaNome}
                      </td>
                      <td className="px-4 py-3">{atividade.responsavelNome}</td>
                      <td className="px-4 py-3">
                        {atividade.encontrosRealizados} de {atividade.encontrosTotal}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={atividade.situacao === "Ativa" ? "default" : "secondary"}>
                          {atividade.situacao}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link to={`/gestao/atividades/${atividade.id}`} className={actionButton}>
                          {registrarAtividade ? "Encontros e chamada" : "Ver encontros"}
                        </Link>
                        {registrarAtividade && (
                          <button
                            type="button"
                            className={actionButton}
                            onClick={() => abrirEdicao(atividade)}
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {lista.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                      >
                        {atividades.length === 0
                          ? "Nenhuma atividade cadastrada ainda."
                          : "Nenhuma atividade encontrada com os filtros aplicados."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
