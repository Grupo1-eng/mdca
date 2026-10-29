import { describe, expect, it } from "vitest"
import { educandoVazio, responsavelVazio } from "../educandos/model"
import type { EducandoApi } from "./educandos"
import {
  CAMPOS_AGUARDANDO_MIGRACAO,
  deEducandoApi,
  ehIdPersistido,
  paraEducandoPayload,
  rendaParaApi,
  rendaParaTela,
  responsaveisParaSalvar,
} from "./educandosMapper"

const apiBase: EducandoApi = {
  id: 7,
  organizacaoId: 1,
  nome: "Ana Souza",
  cpf: "123.456.789-09",
  rg: null,
  nis: null,
  corAutodeclarada: "Parda",
  dataNascimento: "2014-03-02T00:00:00.000Z",
  endereco: null,
  telefone: "51 99999-0000",
  escola: "EMEF Leste",
  turno: "Manhã",
  historicoRepetencia: null,
  numerosPessoasFamilias: 4,
  rendaFamiliar: "1500.5",
  beneficiosSociais: null,
  tipoMoradia: null,
  doencaCronica: null,
  medicamentoContinuo: null,
  observacaoSaude: null,
  situacaoAtual: "inativo",
  tecnicoResponsavelId: null,
  responsaveis: [
    {
      id: 3,
      educandoId: 7,
      nome: "Maria Souza",
      vinculo: "Mãe",
      cpf: null,
      rg: null,
      telefone: null,
      profissao: "Diarista",
      tipoTrabalho: null,
      localTrabalho: null,
      escolaridade: null,
    },
  ],
}

describe("ehIdPersistido", () => {
  it("só ids numéricos vieram do servidor", () => {
    expect(ehIdPersistido("12")).toBe(true)
    expect(ehIdPersistido("")).toBe(false)
    expect(ehIdPersistido("resp-ab12cd")).toBe(false)
  })
})

describe("renda familiar", () => {
  it("converte o Decimal do backend para o formato brasileiro", () => {
    expect(rendaParaTela("1500.5")).toBe("1500,5")
    expect(rendaParaTela(null)).toBe("")
  })

  it("aceita formatos comuns ao enviar", () => {
    expect(rendaParaApi("")).toBeNull()
    expect(rendaParaApi("1500")).toBe(1500)
    expect(rendaParaApi("1500,50")).toBe(1500.5)
    expect(rendaParaApi("R$ 1.500,50")).toBe(1500.5)
  })

  it("recusa valores inválidos com mensagem", () => {
    expect(() => rendaParaApi("mil reais")).toThrow(/Renda familiar inválida/)
    expect(() => rendaParaApi("-10")).toThrow(/Renda familiar inválida/)
  })
})

describe("deEducandoApi", () => {
  it("converte ids, datas, situação e responsáveis", () => {
    const educando = deEducandoApi(apiBase)
    expect(educando).toMatchObject({
      id: "7",
      nome: "Ana Souza",
      nascimento: "2014-03-02",
      situacaoVinculo: "Inativo",
      pessoasCasa: 4,
      rendaFamiliar: "1500,5",
      rg: "",
      repetencia: "",
      iniciativaId: "",
      motivosIngresso: [],
    })
    expect(educando.responsaveis).toEqual([
      expect.objectContaining({ id: "3", nome: "Maria Souza", vinculo: "Mãe", cpf: "" }),
    ])
  })

  it("lista sem responsáveis vira lista vazia", () => {
    const { responsaveis: _, ...semResponsaveis } = apiBase
    expect(deEducandoApi({ ...semResponsaveis, situacaoAtual: "ativo" })).toMatchObject({
      responsaveis: [],
      situacaoVinculo: "Ativo",
    })
  })
})

describe("paraEducandoPayload", () => {
  it("envia só campos do backend, com vazios como null", () => {
    const payload = paraEducandoPayload({
      ...educandoVazio(),
      nome: "  João  ",
      nascimento: "2015-01-10",
      rendaFamiliar: "900,00",
      pessoasCasa: 3,
      genero: "Masculino",
      serie: "4º ano",
    })
    expect(payload).toMatchObject({
      nome: "João",
      cpf: null,
      dataNascimento: "2015-01-10",
      rendaFamiliar: 900,
      numerosPessoasFamilias: 3,
    })
    expect(payload).not.toHaveProperty("id")
    expect(payload).not.toHaveProperty("situacaoAtual")
    if (CAMPOS_AGUARDANDO_MIGRACAO) {
      expect(payload).not.toHaveProperty("genero")
      expect(payload).not.toHaveProperty("serie")
    }
  })

  it("exige nome", () => {
    expect(() => paraEducandoPayload(educandoVazio())).toThrow(/nome/)
  })
})

describe("responsaveisParaSalvar", () => {
  it("ignora blocos novos em branco e separa novos de existentes", () => {
    const resultado = responsaveisParaSalvar([
      responsavelVazio(),
      { ...responsavelVazio("5"), nome: "Pai", vinculo: "Pai" },
      { ...responsavelVazio(), nome: " Avó ", vinculo: "Avó", telefone: "" },
    ])
    expect(resultado).toEqual([
      expect.objectContaining({ id: 5, dados: expect.objectContaining({ nome: "Pai" }) }),
      expect.objectContaining({
        id: undefined,
        dados: expect.objectContaining({ nome: "Avó", telefone: null }),
      }),
    ])
  })

  it("exige nome e vínculo quando o bloco foi preenchido", () => {
    expect(() =>
      responsaveisParaSalvar([{ ...responsavelVazio(), nome: "Tia" }]),
    ).toThrow(/nome e vínculo/)
  })
})
