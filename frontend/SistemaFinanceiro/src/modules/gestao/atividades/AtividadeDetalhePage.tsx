import { type FormEvent, useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ErrorState, LoadingState } from "@/components/StatusMessage"
import { useAuth } from "@/context/AuthContext"
import {
  buscarAtividade,
  carregarChamada,
  listarEncontros,
  registrarChamada,
  salvarEncontroRemoto,
} from "../api/atividades"
import { useSalvarGestao } from "../educandos/EducandosContext"
import {
  Badge,
  Card,
  Field,
  PageHeader,
  SaveStatus,
  SensitiveNote,
  inputClass,
  textareaClass,
} from "../educandos/components/EducandoUi"
import type {
  Atividade,
  Chamada,
  Encontro,
  SituacaoEncontro,
} from "../educandos/types"
import {
  aceitaChamada,
  aceitaEncontroNovo,
  dataVisivel,
  encontroVazio,
  hojeLocal,
  marcarRestantesPresentes,
  permissoesAtividades,
  resumoChamada,
  validarEncontro,
} from "./model"

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50"
const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
const actionButton =
  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--muted)] disabled:opacity-50"

const corSituacao: Record<SituacaoEncontro, "default" | "secondary" | "danger" | "outline"> = {
  Planejado: "outline",
  Realizado: "default",
  Cancelado: "danger",
}

function horario(encontro: Encontro): string {
  if (!encontro.horaInicio) return "—"
  return encontro.horaFim ? `${encontro.horaInicio}–${encontro.horaFim}` : encontro.horaInicio
}

export default function AtividadeDetalhePage() {
  const { id = "" } = useParams()
  const { user } = useAuth()
  const { registrarAtividade: podeRegistrar } = permissoesAtividades(user?.perfil)
  const { estado, mensagem, salvar } = useSalvarGestao()

  const [atividade, setAtividade] = useState<Atividade | null>(null)
  const [encontros, setEncontros] = useState<Encontro[]>([])
  const [carga, setCarga] = useState<"carregando" | "pronta" | "erro">("carregando")
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const [form, setForm] = useState<Encontro | null>(null)
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState<string | null>(null)

  const [encontroChamada, setEncontroChamada] = useState<Encontro | null>(null)
  const [chamada, setChamada] = useState<Chamada | null>(null)
  const [erroChamada, setErroChamada] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    const [atividadeApi, encontrosApi] = await Promise.all([
      buscarAtividade(id),
      listarEncontros(id),
    ])
    setAtividade(atividadeApi)
    setEncontros(encontrosApi)
  }, [id])

  useEffect(() => {
    setCarga("carregando")
    recarregar()
      .then(() => setCarga("pronta"))
      .catch((falha: unknown) => {
        setCarga("erro")
        setErroCarga(
          falha instanceof Error ? falha.message : "Não foi possível carregar a atividade.",
        )
      })
  }, [recarregar])

  const abrirChamada = (encontro: Encontro) => {
    setEncontroChamada(encontro)
    setChamada(null)
    setErroChamada(null)
    carregarChamada(encontro.id)
      .then(setChamada)
      .catch((falha: unknown) =>
        setErroChamada(
          falha instanceof Error ? falha.message : "Não foi possível carregar a chamada.",
        ),
      )
  }

  const gravarEncontro = (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    const problema = validarEncontro(form)
    setErroForm(problema)
    if (problema) return
    void salvar(async () => {
      await salvarEncontroRemoto(form)
      await recarregar()
      setForm(null)
    })
  }

  const mudarSituacao = (encontro: Encontro, situacao: SituacaoEncontro) =>
    void salvar(async () => {
      await salvarEncontroRemoto({ ...encontro, situacao })
      await recarregar()
      setCancelando(null)
      if (encontroChamada?.id === encontro.id) abrirChamada({ ...encontro, situacao })
    })

  const gravarChamada = () => {
    if (!encontroChamada || !chamada) return
    void salvar(async () => {
      setChamada(await registrarChamada(encontroChamada.id, chamada.linhas))
      await recarregar()
    })
  }

  const alterarLinha = (educandoId: string, mudanca: Partial<Chamada["linhas"][number]>) =>
    chamada &&
    setChamada({
      ...chamada,
      linhas: chamada.linhas.map((l) => (l.educandoId === educandoId ? { ...l, ...mudanca } : l)),
    })

  if (carga === "carregando") return <LoadingState label="Carregando atividade" />
  if (carga === "erro" || !atividade) {
    return (
      <div className="space-y-4">
        <Link to="/gestao/atividades" className="text-sm text-[#1a3a6b] hover:underline">
          ← Voltar para atividades
        </Link>
        <ErrorState message={erroCarga ?? "Atividade não encontrada."} />
      </div>
    )
  }

  const podeAgendar = podeRegistrar && aceitaEncontroNovo(atividade)
  const editavelChamada =
    podeRegistrar && encontroChamada !== null && chamada !== null && chamada.aceitaChamada
  const resumo = chamada ? resumoChamada(chamada.linhas) : null

  return (
    <div>
      <Link to="/gestao/atividades" className="mb-3 inline-block text-sm text-[#1a3a6b] hover:underline">
        ← Voltar para atividades
      </Link>
      <PageHeader
        titulo={atividade.nome}
        descricao={`${atividade.iniciativaNome} · Responsável: ${atividade.responsavelNome}`}
        acoes={
          <>
            <SaveStatus estado={estado} />
            {mensagem && estado === "error" && (
              <span className="text-sm text-red-600">{mensagem}</span>
            )}
            <Badge variant={atividade.situacao === "Ativa" ? "default" : "secondary"}>
              {atividade.situacao}
            </Badge>
            {podeRegistrar && (
              <button
                type="button"
                className={primaryButton}
                disabled={!podeAgendar}
                title={podeAgendar ? undefined : "Atividade encerrada não aceita encontros novos"}
                onClick={() => {
                  setErroForm(null)
                  setForm(encontroVazio(atividade.id, hojeLocal()))
                }}
              >
                + Novo encontro
              </button>
            )}
          </>
        }
      />

      {atividade.descricao && (
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">{atividade.descricao}</p>
      )}
      {podeRegistrar && !aceitaEncontroNovo(atividade) && (
        <div className="mb-4">
          <SensitiveNote>
            Atividade encerrada: não aceita encontros novos. Para agendar, edite a
            atividade e volte a situação para Ativa.
          </SensitiveNote>
        </div>
      )}

      {form && (
        <Card className="mb-5 p-5">
          <form onSubmit={gravarEncontro} noValidate className="space-y-4">
            <h2 className="text-base font-semibold">
              {form.id ? "Editar encontro" : "Novo encontro"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Data">
                <input
                  type="date"
                  className={inputClass}
                  value={form.data}
                  onChange={(event) => setForm({ ...form, data: event.target.value })}
                />
              </Field>
              <Field label="Início">
                <input
                  type="time"
                  className={inputClass}
                  value={form.horaInicio}
                  onChange={(event) => setForm({ ...form, horaInicio: event.target.value })}
                />
              </Field>
              <Field label="Término">
                <input
                  type="time"
                  className={inputClass}
                  value={form.horaFim}
                  onChange={(event) => setForm({ ...form, horaFim: event.target.value })}
                />
              </Field>
              <Field label="Local">
                <input
                  className={inputClass}
                  value={form.local}
                  onChange={(event) => setForm({ ...form, local: event.target.value })}
                />
              </Field>
              <Field label="Situação">
                <select
                  className={inputClass}
                  value={form.situacao}
                  onChange={(event) =>
                    setForm({ ...form, situacao: event.target.value as SituacaoEncontro })
                  }
                >
                  <option value="Planejado">Planejado</option>
                  <option value="Realizado">Realizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </Field>
              <div className="md:col-span-3">
                <Field label="Observações">
                  <textarea
                    rows={2}
                    className={textareaClass}
                    value={form.observacoes}
                    onChange={(event) => setForm({ ...form, observacoes: event.target.value })}
                  />
                </Field>
              </div>
            </div>
            {erroForm && <p className="text-sm text-red-600">{erroForm}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={primaryButton} disabled={estado === "saving"}>
                Salvar encontro
              </button>
              <button type="button" className={secondaryButton} onClick={() => setForm(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Horário</th>
                <th className="px-4 py-3 font-medium">Local</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">Presenças registradas</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {encontros.map((encontro) => (
                <tr
                  key={encontro.id}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    encontroChamada?.id === encontro.id ? "bg-[#1a3a6b]/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{dataVisivel(encontro.data)}</td>
                  <td className="px-4 py-3">{horario(encontro)}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{encontro.local || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={corSituacao[encontro.situacao]}>{encontro.situacao}</Badge>
                  </td>
                  <td className="px-4 py-3">{encontro.presencasRegistradas}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {cancelando === encontro.id ? (
                      <>
                        <span className="mr-2 text-xs text-[var(--muted-foreground)]">
                          Cancelar o encontro? Ele não é apagado.
                        </span>
                        <button
                          type="button"
                          className={`${actionButton} text-red-600`}
                          disabled={estado === "saving"}
                          onClick={() => mudarSituacao(encontro, "Cancelado")}
                        >
                          Confirmar
                        </button>
                        <button type="button" className={actionButton} onClick={() => setCancelando(null)}>
                          Voltar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`${actionButton} text-[#1a3a6b]`}
                          onClick={() => abrirChamada(encontro)}
                        >
                          {podeRegistrar && aceitaChamada(encontro) ? "Chamada" : "Ver chamada"}
                        </button>
                        {podeRegistrar && (
                          <>
                            {encontro.situacao === "Planejado" && (
                              <button
                                type="button"
                                className={`${actionButton} text-[#0e7e6e]`}
                                disabled={estado === "saving"}
                                onClick={() => mudarSituacao(encontro, "Realizado")}
                              >
                                Marcar realizado
                              </button>
                            )}
                            <button
                              type="button"
                              className={`${actionButton} text-[#1a3a6b]`}
                              onClick={() => {
                                setErroForm(null)
                                setForm(encontro)
                              }}
                            >
                              Editar
                            </button>
                            {encontro.situacao !== "Cancelado" && (
                              <button
                                type="button"
                                className={`${actionButton} text-red-600`}
                                onClick={() => setCancelando(encontro.id)}
                              >
                                Cancelar
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {encontros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--muted-foreground)]">
                    Nenhum encontro agendado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {encontroChamada && (
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                Chamada de {dataVisivel(encontroChamada.data)}
                {encontroChamada.horaInicio && ` às ${encontroChamada.horaInicio}`}
              </h2>
              {resumo && (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {resumo.presentes} presente{resumo.presentes === 1 ? "" : "s"} ·{" "}
                  {resumo.ausentes} ausente{resumo.ausentes === 1 ? "" : "s"} ·{" "}
                  {resumo.semRegistro} sem registro
                </p>
              )}
            </div>
            <button type="button" className={actionButton} onClick={() => setEncontroChamada(null)}>
              Fechar
            </button>
          </div>

          {erroChamada && <ErrorState message={erroChamada} />}
          {!chamada && !erroChamada && <LoadingState label="Carregando chamada" />}

          {chamada && (
            <>
              {!chamada.aceitaChamada && (
                <div className="mb-3">
                  <SensitiveNote>Encontro cancelado: a chamada não pode ser registrada.</SensitiveNote>
                </div>
              )}
              {chamada.linhas.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhum educando ativo vinculado a esta iniciativa. O vínculo é feito
                  na ficha do educando.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Educando</th>
                        <th className="px-3 py-2 font-medium">Presença</th>
                        <th className="px-3 py-2 font-medium">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chamada.linhas.map((linha) => (
                        <tr key={linha.educandoId} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-3 py-2">
                            <span className="font-medium">{linha.nome}</span>
                            {linha.desvinculado && (
                              <span className="ml-2">
                                <Badge variant="outline">desvinculado</Badge>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {editavelChamada ? (
                              <div className="inline-flex overflow-hidden rounded-md border border-[var(--border)] text-xs">
                                {([true, false] as const).map((valor) => (
                                  <button
                                    key={String(valor)}
                                    type="button"
                                    aria-pressed={linha.presente === valor}
                                    onClick={() => alterarLinha(linha.educandoId, { presente: valor })}
                                    className={`px-3 py-1.5 transition-colors ${
                                      linha.presente === valor
                                        ? valor
                                          ? "bg-[#0e7e6e] text-white"
                                          : "bg-red-600 text-white"
                                        : "bg-white hover:bg-[var(--muted)]"
                                    }`}
                                  >
                                    {valor ? "Presente" : "Ausente"}
                                  </button>
                                ))}
                              </div>
                            ) : linha.presente === null ? (
                              <span className="text-[var(--muted-foreground)]">Sem registro</span>
                            ) : (
                              <Badge variant={linha.presente ? "default" : "secondary"}>
                                {linha.presente ? "Presente" : "Ausente"}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {editavelChamada ? (
                              <input
                                className={`${inputClass} h-8`}
                                value={linha.observacao}
                                aria-label={`Observação de ${linha.nome}`}
                                onChange={(event) =>
                                  alterarLinha(linha.educandoId, { observacao: event.target.value })
                                }
                              />
                            ) : (
                              <span className="text-[var(--muted-foreground)]">{linha.observacao || "—"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {editavelChamada && chamada.linhas.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={primaryButton}
                    disabled={estado === "saving" || resumo?.presentes === 0 && resumo?.ausentes === 0}
                    onClick={gravarChamada}
                  >
                    Salvar chamada
                  </button>
                  <button
                    type="button"
                    className={secondaryButton}
                    disabled={resumo?.semRegistro === 0}
                    onClick={() => setChamada({ ...chamada, linhas: marcarRestantesPresentes(chamada.linhas) })}
                  >
                    Marcar restantes como presentes
                  </button>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Salvar de novo atualiza a chamada; não duplica registros.
                  </span>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}
