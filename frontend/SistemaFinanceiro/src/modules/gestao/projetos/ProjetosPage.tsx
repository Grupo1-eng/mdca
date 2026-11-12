import { type FormEvent, useEffect, useState } from "react"
import { ErrorState, LoadingState } from "@/components/StatusMessage"
import { useAuth } from "@/context/AuthContext"
import { atualizarProjeto, criarProjeto } from "../api/projetos"
import { carregarIniciativas } from "../api/projetosFluxo"
import {
  STATUS_INICIATIVA,
  tipoParaTela,
  paraProjetoPayload,
  type IniciativaTela,
} from "../api/projetosMapper"
import { TIPOS_PROJETO, type TipoProjetoApi } from "../api/projetos"
import {
  Card,
  Field,
  PageHeader,
  SaveStatus,
  SensitiveNote,
  inputClass,
  textareaClass,
} from "../educandos/components/EducandoUi"
import {
  useEducandosGestao,
  useSalvarGestao,
} from "../educandos/EducandosContext"
import { filtrarIniciativas, iniciativaVazia } from "./model"

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50"
const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]"

function dataVisivel(valor: string): string {
  if (!valor) return "—"
  const [ano, mes, dia] = valor.split("-")
  if (!ano || !mes || !dia) return valor
  return `${dia}/${mes}/${ano}`
}

export default function ProjetosPage() {
  const { user } = useAuth()
  const podeEditar = user?.perfil === "coordenador"
  const { estado, mensagem, salvar } = useSalvarGestao()
  const { atualizarIniciativas } = useEducandosGestao()
  const [lista, setLista] = useState<IniciativaTela[]>([])
  const [carga, setCarga] = useState<"carregando" | "pronta" | "erro">("carregando")
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [tipo, setTipo] = useState<"todos" | TipoProjetoApi>("todos")
  const [status, setStatus] = useState("todos")
  const [form, setForm] = useState<IniciativaTela | null>(null)

  const recarregar = () => {
    setCarga("carregando")
    setErro(null)
    carregarIniciativas()
      .then((iniciativas) => {
        setLista(iniciativas)
        setCarga("pronta")
      })
      .catch((falha: unknown) => {
        setCarga("erro")
        setErro(
          falha instanceof Error
            ? falha.message
            : "Não foi possível carregar as iniciativas.",
        )
      })
  }

  useEffect(() => {
    recarregar()
  }, [])

  const visiveis = filtrarIniciativas(lista, { busca, tipo, status })

  const gravar = (event: FormEvent) => {
    event.preventDefault()
    if (!form || !podeEditar) return
    void salvar(async () => {
      const payload = paraProjetoPayload(form)
      if (form.id) await atualizarProjeto(Number(form.id), payload)
      else await criarProjeto(payload)
      setLista(await carregarIniciativas())
      // A ficha do educando usa a lista do contexto: recarrega para a nova
      // iniciativa aparecer sem precisar atualizar a página.
      atualizarIniciativas()
      setForm(null)
    })
  }

  return (
    <div>
      <PageHeader
        titulo="Projetos, serviços e programas"
        descricao="Iniciativas da organização. O cadastro é feito aqui, pela coordenação, e as iniciativas também aparecem no Financeiro."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <SaveStatus estado={estado} />
            {mensagem && estado === "error" && (
              <span className="text-sm text-red-600">{mensagem}</span>
            )}
            {podeEditar && (
              <button
                type="button"
                className={primaryButton}
                onClick={() => setForm(iniciativaVazia())}
              >
                + Nova iniciativa
              </button>
            )}
          </div>
        }
      />

      {carga === "carregando" && <LoadingState label="Carregando iniciativas" />}
      {carga === "erro" && erro && <ErrorState message={erro} />}

      {carga === "pronta" && (
        <>
          <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
            <input
              className={`${inputClass} min-w-64 flex-1`}
              placeholder="Buscar por nome"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              aria-label="Buscar iniciativa"
            />
            <select
              className={`${inputClass} w-full md:w-44`}
              value={tipo}
              onChange={(event) =>
                setTipo(event.target.value as "todos" | TipoProjetoApi)
              }
              aria-label="Filtrar por tipo"
            >
              <option value="todos">Todos os tipos</option>
              {TIPOS_PROJETO.map((item) => (
                <option key={item} value={item}>
                  {tipoParaTela(item)}
                </option>
              ))}
            </select>
            <select
              className={`${inputClass} w-full md:w-48`}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filtrar por situação"
            >
              <option value="todos">Todas as situações</option>
              {STATUS_INICIATIVA.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Card>

          {form && podeEditar && (
            <Card className="mb-4 p-5">
              <h2 className="mb-4 text-base font-semibold">
                {form.id ? "Editar iniciativa" : "Nova iniciativa"}
              </h2>
              <form onSubmit={gravar} className="grid gap-4 md:grid-cols-2">
                <Field label="Nome" full>
                  <input
                    className={inputClass}
                    value={form.nome}
                    required
                    onChange={(event) =>
                      setForm({ ...form, nome: event.target.value })
                    }
                  />
                </Field>
                <Field label="Descrição" full>
                  <textarea
                    className={textareaClass}
                    rows={2}
                    value={form.descricao}
                    onChange={(event) =>
                      setForm({ ...form, descricao: event.target.value })
                    }
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    className={inputClass}
                    value={form.tipo}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        tipo: event.target.value as TipoProjetoApi,
                      })
                    }
                  >
                    {TIPOS_PROJETO.map((item) => (
                      <option key={item} value={item}>
                        {tipoParaTela(item)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Situação">
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value })
                    }
                  >
                    {STATUS_INICIATIVA.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                    {!STATUS_INICIATIVA.includes(
                      form.status as (typeof STATUS_INICIATIVA)[number],
                    ) &&
                      form.status && <option value={form.status}>{form.status}</option>}
                  </select>
                </Field>
                <Field label="Orçamento total (R$)">
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={form.orcamento}
                    placeholder="0,00"
                    onChange={(event) =>
                      setForm({ ...form, orcamento: event.target.value })
                    }
                  />
                </Field>
                <Field label="Início">
                  <input
                    className={inputClass}
                    type="date"
                    value={form.dataInicio}
                    onChange={(event) =>
                      setForm({ ...form, dataInicio: event.target.value })
                    }
                  />
                </Field>
                <Field label="Fim previsto">
                  <input
                    className={inputClass}
                    type="date"
                    value={form.dataFim}
                    onChange={(event) =>
                      setForm({ ...form, dataFim: event.target.value })
                    }
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                  <button
                    type="submit"
                    className={primaryButton}
                    disabled={estado === "saving"}
                  >
                    Salvar
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

          <Card>
            {visiveis.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-foreground)]">
                {lista.length === 0
                  ? "Nenhuma iniciativa cadastrada para esta organização."
                  : "Nenhuma iniciativa corresponde aos filtros."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Situação</th>
                      <th className="px-4 py-3 font-medium">Início</th>
                      <th className="px-4 py-3 font-medium">Fim</th>
                      {podeEditar && <th className="px-4 py-3 font-medium" />}
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.nome}</p>
                          {item.descricao && (
                            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                              {item.descricao}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">{tipoParaTela(item.tipo)}</td>
                        <td className="px-4 py-3">{item.status}</td>
                        <td className="px-4 py-3">{dataVisivel(item.dataInicio)}</td>
                        <td className="px-4 py-3">{dataVisivel(item.dataFim)}</td>
                        {podeEditar && (
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1a3a6b] transition-colors hover:bg-[var(--muted)]"
                              onClick={() => setForm(item)}
                            >
                              Editar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
