import { type FormEvent, useEffect, useRef, useState } from "react"
import { ErrorState, LoadingState } from "@/components/StatusMessage"
import { useAuth } from "@/context/AuthContext"
import type { Perfil, Usuario } from "@/types/financeiro"
import {
  atualizarUsuario,
  criarUsuario,
  inativarUsuario,
  listarUsuarios,
  reativarUsuario,
} from "../api/usuarios"
import {
  Badge,
  Card,
  Field,
  PageHeader,
  SaveStatus,
  inputClass,
} from "../educandos/components/EducandoUi"
import { useSalvarGestao } from "../educandos/EducandosContext"
import {
  GRUPOS_PERFIL,
  SENHA_MINIMA,
  type FiltroUsuarios,
  type FormUsuario,
  filtrarUsuarios,
  formDeUsuario,
  formNovoUsuario,
  mensagemErroUsuario,
  paraEdicaoUsuario,
  paraNovoUsuario,
  podeGerenciarUsuarios,
  rotuloPerfilGestao,
  validarUsuario,
} from "./model"

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50"
const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
const linkButton =
  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--muted)] disabled:opacity-50"

function dataVisivel(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-")
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—"
}

function OpcoesPerfil() {
  return (
    <>
      {GRUPOS_PERFIL.map((grupo) => (
        <optgroup key={grupo.titulo} label={grupo.titulo}>
          {grupo.perfis.map((perfil) => (
            <option key={perfil} value={perfil}>
              {rotuloPerfilGestao[perfil]}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}

export default function UsuariosPage() {
  const { user } = useAuth()
  const podeGerenciar = podeGerenciarUsuarios(user?.perfil)
  const { estado, mensagem, salvar } = useSalvarGestao()
  const [lista, setLista] = useState<Usuario[]>([])
  const [carga, setCarga] = useState<"carregando" | "pronta" | "erro">(
    "carregando",
  )
  const [erroCarga, setErroCarga] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroUsuarios>({
    busca: "",
    perfil: "todos",
    situacao: "todos",
  })
  const [form, setForm] = useState<FormUsuario | null>(null)
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [inativando, setInativando] = useState<number | null>(null)
  const [enviandoForm, setEnviandoForm] = useState(false)
  const cartaoForm = useRef<HTMLDivElement>(null)
  const campoNome = useRef<HTMLInputElement>(null)
  // Muda a cada "Editar" ou "+ Novo usuário", para rolar mesmo ao trocar de
  // usuário com o formulário já aberto.
  const [aberturaForm, setAberturaForm] = useState(0)

  // O formulário fica acima da lista: ao abrir, rola até ele e foca o nome.
  useEffect(() => {
    if (aberturaForm === 0) return
    cartaoForm.current?.scrollIntoView?.({ behavior: "smooth", block: "start" })
    campoNome.current?.focus({ preventScroll: true })
  }, [aberturaForm])

  const abrirForm = (novo: FormUsuario) => {
    setErroForm(null)
    setForm(novo)
    setAberturaForm((n) => n + 1)
  }

  useEffect(() => {
    if (!podeGerenciar) return
    listarUsuarios()
      .then((usuarios) => {
        setLista(usuarios)
        setCarga("pronta")
      })
      .catch((falha: unknown) => {
        setCarga("erro")
        setErroCarga(
          falha instanceof Error
            ? falha.message
            : "Não foi possível carregar os usuários.",
        )
      })
  }, [podeGerenciar])

  if (!podeGerenciar) {
    return (
      <div>
        <PageHeader titulo="Usuários" />
        <Card className="p-5 text-sm text-[var(--muted-foreground)]">
          Só a coordenação gerencia os usuários do sistema.
        </Card>
      </div>
    )
  }

  const visiveis = filtrarUsuarios(lista, filtro)
  const ativos = lista.filter((u) => u.ativo).length
  const propriaConta = form?.id !== null && form?.id === user?.id

  // Cada gravação relê a lista, para refletir o que o backend guardou.
  const executar = (acao: () => Promise<unknown>) =>
    salvar(async () => {
      await acao()
      setLista(await listarUsuarios())
    })

  // Erros do formulário aparecem dentro dele, em português, e não no topo
  // da página (o backend devolve parte das validações em inglês).
  const gravar = async (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    const problema = validarUsuario(form)
    setErroForm(problema)
    if (problema) return
    setEnviandoForm(true)
    try {
      if (form.id === null) await criarUsuario(paraNovoUsuario(form))
      else await atualizarUsuario(form.id, paraEdicaoUsuario(form, propriaConta))
    } catch (falha) {
      setErroForm(
        mensagemErroUsuario(
          falha instanceof Error ? falha.message : "Não foi possível salvar.",
        ),
      )
      return
    } finally {
      setEnviandoForm(false)
    }
    setForm(null)
    void executar(async () => {})
  }

  const confirmarInativacao = (id: number) =>
    void executar(async () => {
      await inativarUsuario(id)
      setInativando(null)
    })

  const reativar = (id: number) => void executar(() => reativarUsuario(id))

  return (
    <div>
      <PageHeader
        titulo="Usuários"
        descricao={`Contas de acesso da organização, dos dois módulos. ${lista.length} usuário${lista.length === 1 ? "" : "s"}, ${ativos} ativo${ativos === 1 ? "" : "s"}.`}
        acoes={
          <>
            <SaveStatus estado={estado} />
            {mensagem && estado === "error" && (
              <span className="text-sm text-red-600">{mensagem}</span>
            )}
            <button
              type="button"
              className={primaryButton}
              onClick={() => abrirForm(formNovoUsuario())}
            >
              + Novo usuário
            </button>
          </>
        }
      />

      {carga === "carregando" && <LoadingState label="Carregando usuários" />}
      {carga === "erro" && erroCarga && <ErrorState message={erroCarga} />}

      {carga === "pronta" && (
        <>
          <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
            <input
              className={`${inputClass} min-w-64 flex-1`}
              placeholder="Buscar por nome ou e-mail"
              value={filtro.busca}
              onChange={(event) =>
                setFiltro({ ...filtro, busca: event.target.value })
              }
              aria-label="Buscar usuário"
            />
            <select
              className={`${inputClass} w-full md:w-56`}
              value={filtro.perfil}
              onChange={(event) =>
                setFiltro({
                  ...filtro,
                  perfil: event.target.value as "todos" | Perfil,
                })
              }
              aria-label="Filtrar por perfil"
            >
              <option value="todos">Todos os perfis</option>
              <OpcoesPerfil />
            </select>
            <select
              className={`${inputClass} w-full md:w-40`}
              value={filtro.situacao}
              onChange={(event) =>
                setFiltro({
                  ...filtro,
                  situacao: event.target.value as FiltroUsuarios["situacao"],
                })
              }
              aria-label="Filtrar por situação"
            >
              <option value="todos">Todas as situações</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </Card>

          {form && (
            <div ref={cartaoForm} className="scroll-mt-4">
            <Card className="mb-4 p-5">
              <h2 className="mb-1 text-base font-semibold">
                {form.id === null ? "Novo usuário" : "Editar usuário"}
              </h2>
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                {form.id === null
                  ? "A pessoa entra com este e-mail e a senha inicial definida aqui."
                  : "Deixe a senha em branco para manter a atual."}
              </p>
              <form
                onSubmit={(event) => void gravar(event)}
                noValidate
                className="grid gap-4 md:grid-cols-2"
              >
                <Field label="Nome completo">
                  <input
                    ref={campoNome}
                    className={inputClass}
                    value={form.nome}
                    onChange={(event) =>
                      setForm({ ...form, nome: event.target.value })
                    }
                  />
                </Field>
                <Field label="E-mail">
                  <input
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                  />
                </Field>
                <Field label="Perfil">
                  <select
                    className={inputClass}
                    value={form.perfil}
                    disabled={propriaConta}
                    onChange={(event) =>
                      setForm({ ...form, perfil: event.target.value as Perfil })
                    }
                  >
                    <OpcoesPerfil />
                  </select>
                  {propriaConta && (
                    <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                      Você não pode alterar o próprio perfil.
                    </span>
                  )}
                </Field>
                <div className="hidden md:block" />
                <Field label={form.id === null ? "Senha inicial" : "Nova senha"}>
                  <input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
                    value={form.senha}
                    onChange={(event) =>
                      setForm({ ...form, senha: event.target.value })
                    }
                  />
                </Field>
                <Field label="Confirmar senha">
                  <input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmarSenha}
                    onChange={(event) =>
                      setForm({ ...form, confirmarSenha: event.target.value })
                    }
                  />
                </Field>
                {erroForm && (
                  <p
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2"
                  >
                    {erroForm}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                  <button
                    type="submit"
                    className={primaryButton}
                    disabled={estado === "saving" || enviandoForm}
                  >
                    {form.id === null ? "Criar usuário" : "Salvar alterações"}
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
            </div>
          )}

          <Card>
            {visiveis.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-foreground)]">
                Nenhum usuário corresponde aos filtros.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium">Perfil</th>
                      <th className="px-4 py-3 font-medium">Criado em</th>
                      <th className="px-4 py-3 font-medium">Situação</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((u) => {
                      const proprio = u.id === user?.id
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium">
                              {u.nome}
                              {proprio && (
                                <span className="ml-2">
                                  <Badge variant="outline">você</Badge>
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                              {u.email}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {rotuloPerfilGestao[u.perfil] ?? u.perfil}
                          </td>
                          <td className="px-4 py-3">{dataVisivel(u.criadoEm)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={u.ativo ? "default" : "outline"}>
                              {u.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {inativando === u.id ? (
                              <>
                                <span className="mr-2 text-xs text-[var(--muted-foreground)]">
                                  Perde o acesso na hora. Confirmar?
                                </span>
                                <button
                                  type="button"
                                  className={`${linkButton} text-red-600`}
                                  disabled={estado === "saving"}
                                  onClick={() => confirmarInativacao(u.id)}
                                >
                                  Inativar
                                </button>
                                <button
                                  type="button"
                                  className={linkButton}
                                  onClick={() => setInativando(null)}
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={`${linkButton} text-[#1a3a6b]`}
                                  onClick={() => abrirForm(formDeUsuario(u))}
                                >
                                  Editar
                                </button>
                                {!proprio &&
                                  (u.ativo ? (
                                    <button
                                      type="button"
                                      className={`${linkButton} text-red-600`}
                                      onClick={() => setInativando(u.id)}
                                    >
                                      Inativar
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className={`${linkButton} text-[#0e7e6e]`}
                                      disabled={estado === "saving"}
                                      onClick={() => reativar(u.id)}
                                    >
                                      Reativar
                                    </button>
                                  ))}
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })}
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
