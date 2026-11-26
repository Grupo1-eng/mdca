import { describe, expect, it } from "vitest"
import { educandosSeed } from "./data/mock"
import {
  cpfIncompleto,
  formatarCpf,
  alternarSituacaoEmMemoria,
  duplicidadeDe,
  educandoVazio,
  filtrarEducandos,
  permissoesEducandos,
  salvarEducandoEmMemoria,
  idadeEm,
  confereFaixaEtaria,
  problemaFaixaEtaria,
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

  it("administrativo vê o mesmo que o educador: sem ficha cadastral", () => {
    expect(permissoesEducandos("administrativo")).toEqual(
      permissoesEducandos("educador"),
    )
    expect(permissoesEducandos("administrativo").verCadastro).toBe(false)
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

describe("CPF", () => {
  it("aceita só números, no máximo 11, com máscara", () => {
    expect(formatarCpf("123")).toBe("123")
    expect(formatarCpf("1234567")).toBe("123.456.7")
    expect(formatarCpf("12345678910")).toBe("123.456.789-10")
    expect(formatarCpf("123.456.789-10999abc")).toBe("123.456.789-10")
  })

  it("CPF vazio é permitido; preenchido precisa de 11 dígitos", () => {
    expect(cpfIncompleto("")).toBe(false)
    expect(cpfIncompleto("123.456.789-1")).toBe(true)
    expect(cpfIncompleto("123.456.789-10")).toBe(false)
  })
})

describe("faixa etária (questionário da MDCA, pergunta 4)", () => {
  const hoje = new Date(2026, 10, 24) // 24/11/2026, horário local

  it("calcula a idade completa, contando o aniversário", () => {
    expect(idadeEm("2020-11-24", hoje)).toBe(6)
    expect(idadeEm("2020-11-25", hoje)).toBe(5)
    expect(idadeEm("", hoje)).toBeNull()
  })

  it("aceita de 6 a 17 anos e recusa fora disso", () => {
    expect(problemaFaixaEtaria("2020-11-24", hoje)).toBeNull()
    expect(problemaFaixaEtaria("2008-11-25", hoje)).toBeNull()
    expect(problemaFaixaEtaria("2020-11-25", hoje)).toMatch(/de 6 a 17 anos.*tem 5 anos/)
    expect(problemaFaixaEtaria("2008-11-24", hoje)).toMatch(/tem 18 anos/)
  })

  it("recusa data no futuro", () => {
    expect(problemaFaixaEtaria("2027-01-01", hoje)).toBe(
      "A data de nascimento não pode ser no futuro.",
    )
  })
})


describe("confereFaixaEtaria", () => {
  it("confere no cadastro novo e quando a data muda na edição", () => {
    expect(confereFaixaEtaria("2015-03-10", undefined)).toBe(true)
    expect(confereFaixaEtaria("2015-03-10", "2014-03-10")).toBe(true)
    expect(confereFaixaEtaria("2015-03-10", "")).toBe(true)
  })

  it("não confere se a data não mudou (quem fez 18 segue editável) ou está vazia", () => {
    expect(confereFaixaEtaria("2005-03-10", "2005-03-10")).toBe(false)
    expect(confereFaixaEtaria("", "2005-03-10")).toBe(false)
    expect(confereFaixaEtaria("", undefined)).toBe(false)
  })
})
