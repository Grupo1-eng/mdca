import { describe, expect, it } from "vitest"
import type { Usuario } from "@/types/financeiro"
import {
  GRUPOS_PERFIL,
  filtrarUsuarios,
  formDeUsuario,
  formNovoUsuario,
  paraEdicaoUsuario,
  paraNovoUsuario,
  podeGerenciarUsuarios,
  rotuloPerfilGestao,
  validarUsuario,
} from "./model"

const usuario = (dados: Partial<Usuario>): Usuario => ({
  id: 1,
  organizacaoId: 1,
  nome: "Ana",
  email: "ana@mdca.org.br",
  perfil: "educador",
  ativo: true,
  criadoEm: "2026-11-01T12:00:00.000Z",
  ...dados,
})

describe("acesso à tela de usuários", () => {
  it("só a coordenação gerencia usuários", () => {
    expect(podeGerenciarUsuarios("coordenador")).toBe(true)
    for (const perfil of [
      "educador",
      "tecnico_servico_social",
      "tecnico_psicologia",
      "administrativo",
      "coordenador_financeiro",
      undefined,
    ] as const) {
      expect(podeGerenciarUsuarios(perfil)).toBe(false)
    }
  })

  it("oferece todos os perfis do sistema, cada um uma vez", () => {
    const perfis = GRUPOS_PERFIL.flatMap((grupo) => grupo.perfis)
    expect(new Set(perfis).size).toBe(perfis.length)
    expect([...perfis].sort()).toEqual(Object.keys(rotuloPerfilGestao).sort())
  })
})

describe("filtrarUsuarios", () => {
  const lista = [
    usuario({ id: 1, nome: "Bruno", email: "bruno@x.org", perfil: "educador" }),
    usuario({ id: 2, nome: "Ana", email: "ana@x.org", perfil: "coordenador" }),
    usuario({ id: 3, nome: "Carla", email: "carla@x.org", perfil: "educador", ativo: false }),
  ]
  const todos = { busca: "", perfil: "todos", situacao: "todos" } as const

  it("ordena por nome", () => {
    expect(filtrarUsuarios(lista, todos).map((u) => u.nome)).toEqual(["Ana", "Bruno", "Carla"])
  })

  it("busca por nome ou e-mail, sem diferenciar maiúsculas", () => {
    expect(filtrarUsuarios(lista, { ...todos, busca: "BRU" }).map((u) => u.id)).toEqual([1])
    expect(filtrarUsuarios(lista, { ...todos, busca: "carla@" }).map((u) => u.id)).toEqual([3])
  })

  it("filtra por perfil e situação", () => {
    expect(filtrarUsuarios(lista, { ...todos, perfil: "educador" }).map((u) => u.id)).toEqual([1, 3])
    expect(filtrarUsuarios(lista, { ...todos, situacao: "ativos" }).map((u) => u.id)).toEqual([2, 1])
    expect(filtrarUsuarios(lista, { ...todos, situacao: "inativos" }).map((u) => u.id)).toEqual([3])
  })
})

describe("validarUsuario", () => {
  const novo = { ...formNovoUsuario(), nome: "Ana", email: "ana@x.org", senha: "senha-123", confirmarSenha: "senha-123" }

  it("aceita um usuário novo completo", () => {
    expect(validarUsuario(novo)).toBeNull()
  })

  it("exige nome, e-mail e senha inicial no cadastro", () => {
    expect(validarUsuario({ ...novo, nome: "  " })).toBe("Informe o nome.")
    expect(validarUsuario({ ...novo, email: "" })).toBe("Informe o e-mail.")
    expect(validarUsuario({ ...novo, senha: "", confirmarSenha: "" })).toBe("Defina a senha inicial.")
  })

  it("exige senha com 8 caracteres e confirmação igual", () => {
    expect(validarUsuario({ ...novo, senha: "curta", confirmarSenha: "curta" })).toMatch(/8 caracteres/)
    expect(validarUsuario({ ...novo, confirmarSenha: "outra-senha" })).toBe("As senhas não coincidem.")
  })

  it("na edição, a senha em branco mantém a atual", () => {
    expect(validarUsuario(formDeUsuario(usuario({})))).toBeNull()
  })
})

describe("dados enviados ao backend", () => {
  it("cadastro envia nome e e-mail sem espaços, perfil e senha", () => {
    const form = { ...formNovoUsuario(), nome: " Ana ", email: " ana@x.org ", perfil: "tecnico_psicologia" as const, senha: "senha-123", confirmarSenha: "senha-123" }
    expect(paraNovoUsuario(form)).toEqual({ nome: "Ana", email: "ana@x.org", perfil: "tecnico_psicologia", senha: "senha-123" })
  })

  it("edição só envia a senha quando preenchida", () => {
    const form = formDeUsuario(usuario({ perfil: "administrativo" }))
    expect(paraEdicaoUsuario(form, false)).toEqual({ nome: "Ana", email: "ana@mdca.org.br", perfil: "administrativo" })
    expect(paraEdicaoUsuario({ ...form, senha: "nova-senha", confirmarSenha: "nova-senha" }, false).senha).toBe("nova-senha")
  })

  it("na própria conta, não envia o perfil (o backend recusa)", () => {
    expect(paraEdicaoUsuario(formDeUsuario(usuario({ perfil: "coordenador" })), true)).not.toHaveProperty("perfil")
  })
})
