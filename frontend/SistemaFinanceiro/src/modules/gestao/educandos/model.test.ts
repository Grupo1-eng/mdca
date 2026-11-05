import { describe, expect, it } from "vitest"
import { educandosSeed } from "./data/mock"
import {
  alternarSituacaoEmMemoria,
  duplicidadeDe,
  educandoVazio,
  filtrarEducandos,
  permissoesEducandos,
  salvarEducandoEmMemoria,
} from "./model"

describe("domínio temporário de Educandos", () => {
  const novoEducando = (cpf = "99999999999", nis = "9999999999") => ({
    ...educandoVazio(),
    id: "edu-novo",
    nome: "Novo Educando",
    cpf,
    nis,
  })

  it("combina busca, iniciativa e situação", () => {
    const resultado = filtrarEducandos(educandosSeed, "ana", "ini-1", "Ativo")
    expect(resultado.map((educando) => educando.id)).toEqual(["edu-1"])
    expect(
      filtrarEducandos(educandosSeed, "", "todas", "Inativo"),
    ).toHaveLength(1)
  })

  it("bloqueia CPF idêntico", () => {
    const duplicidade = duplicidadeDe(educandosSeed, {
      id: "",
      cpf: "123.456.789-00",
      nis: "",
    })
    expect(duplicidade).toMatchObject({ campo: "cpf" })
    expect(duplicidade?.educando.id).toBe("edu-1")
  })

  it("bloqueia o mesmo CPF com formatação diferente", () => {
    const registro = novoEducando("12345678900", "")
    expect(() => salvarEducandoEmMemoria(educandosSeed, registro)).toThrow(
      "Este CPF já pertence a Ana Beatriz Souza.",
    )
  })

  it("bloqueia NIS duplicado, inclusive com formatação diferente", () => {
    const registro = novoEducando("", "123.456.789-0")
    expect(duplicidadeDe(educandosSeed, registro)?.campo).toBe("nis")
    expect(() => salvarEducandoEmMemoria(educandosSeed, registro)).toThrow(
      "Este NIS já pertence a Ana Beatriz Souza.",
    )
  })

  it("permite editar o próprio registro mantendo o CPF", () => {
    const editado = { ...educandosSeed[0], nome: "Ana Beatriz Editada" }
    const resultado = salvarEducandoEmMemoria(educandosSeed, editado)
    expect(resultado).toHaveLength(educandosSeed.length)
    expect(resultado[0].nome).toBe("Ana Beatriz Editada")
  })

  it("bloqueia edição que tenta assumir o CPF de outro educando", () => {
    const editado = { ...educandosSeed[1], cpf: educandosSeed[0].cpf }
    expect(() => salvarEducandoEmMemoria(educandosSeed, editado)).toThrow(
      "Este CPF já pertence a Ana Beatriz Souza.",
    )
  })

  it("permite criar com CPF e NIS novos", () => {
    const registro = novoEducando()
    const resultado = salvarEducandoEmMemoria(educandosSeed, registro)
    expect(resultado).toHaveLength(educandosSeed.length + 1)
    expect(resultado.at(-1)).toEqual(registro)
  })

  it("valida a duplicidade contra educandos criados no estado atual", () => {
    const primeiro = novoEducando()
    const estadoAtual = salvarEducandoEmMemoria(educandosSeed, primeiro)
    const segundo = {
      ...novoEducando("999.999.999-99", "8888888888"),
      id: "edu-outro",
      nome: "Outro Educando",
    }

    expect(() => salvarEducandoEmMemoria(estadoAtual, segundo)).toThrow(
      "Este CPF já pertence a Novo Educando.",
    )
    expect(estadoAtual).toHaveLength(educandosSeed.length + 1)
  })

  it("não trata documentos vazios como duplicidade nem ignora inativos", () => {
    expect(duplicidadeDe(educandosSeed, novoEducando("", ""))).toBeUndefined()

    const inativos = educandosSeed.map((educando, indice) =>
      indice === 0
        ? { ...educando, situacaoVinculo: "Inativo" as const }
        : educando,
    )
    expect(
      duplicidadeDe(inativos, novoEducando("12345678900", ""))?.educando.id,
    ).toBe("edu-1")
  })

  it("usa os perfis canônicos do backend", () => {
    expect(permissoesEducandos("coordenador").inativarEducando).toBe(true)
    expect(permissoesEducandos("tecnico_servico_social").editarCadastro).toBe(
      true,
    )
    expect(permissoesEducandos("administrativo").editarCadastro).toBe(false)
    expect(permissoesEducandos("educador").verCadastro).toBe(false)
  })

  it("cria, edita e inativa um educando durante a sessão", () => {
    const novo = novoEducando()
    const criados = salvarEducandoEmMemoria(educandosSeed, novo)
    expect(criados).toHaveLength(educandosSeed.length + 1)

    const editados = salvarEducandoEmMemoria(criados, {
      ...novo,
      nome: "Educando Editado",
    })
    expect(editados.find((educando) => educando.id === novo.id)?.nome).toBe(
      "Educando Editado",
    )

    const inativados = alternarSituacaoEmMemoria(editados, novo.id)
    expect(
      inativados.find((educando) => educando.id === novo.id)?.situacaoVinculo,
    ).toBe("Inativo")
  })
})
