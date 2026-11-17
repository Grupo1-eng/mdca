import { describe, expect, it } from "vitest"
import {
  deProjetoApi,
  orcamentoParaApi,
  paraProjetoPayload,
  tipoParaApi,
  tipoParaTela,
} from "./projetosMapper"
import { filtrarIniciativas } from "../projetos/model"

describe("tipo", () => {
  it("traduz SERVICO para Serviço e de volta", () => {
    expect(tipoParaTela("SERVICO")).toBe("Serviço")
    expect(tipoParaTela("PROJETO")).toBe("Projeto")
    expect(tipoParaTela("PROGRAMA")).toBe("Programa")
    expect(tipoParaApi("Serviço")).toBe("SERVICO")
    expect(tipoParaApi("servico")).toBe("SERVICO")
    expect(tipoParaApi("Programa")).toBe("PROGRAMA")
  })
})

describe("deProjetoApi", () => {
  it("não inventa código e lê a data pela parte AAAA-MM-DD", () => {
    const tela = deProjetoApi({
      id: 12,
      nome: "Serviço de convivência",
      descricao: null,
      tipo: "SERVICO",
      status: "Em andamento",
      orcamentoTotal: "1500.5",
      dataInicio: "2026-03-01T00:00:00.000Z",
      dataFim: null,
    })
    expect(tela).toMatchObject({
      id: "12",
      nome: "Serviço de convivência",
      descricao: "",
      tipo: "SERVICO",
      status: "Em andamento",
      orcamento: "1500,50",
      dataInicio: "2026-03-01",
      dataFim: "",
    })
    expect(tela).not.toHaveProperty("codigo")
  })
})

describe("paraProjetoPayload", () => {
  it("envia o tipo em maiúsculas e o orçamento com ponto", () => {
    const payload = paraProjetoPayload({
      id: "12",
      nome: "  Semear  ",
      descricao: "  ",
      tipo: "PROJETO",
      status: "Planejamento",
      orcamento: "1.500,50",
      dataInicio: "2026-03-01",
      dataFim: "",
    })
    expect(payload).toEqual({
      nome: "Semear",
      descricao: null,
      tipo: "PROJETO",
      status: "Planejamento",
      orcamentoTotal: "1500.50",
      dataInicio: "2026-03-01",
      dataFim: null,
    })
    expect(payload).not.toHaveProperty("codigo")
  })

  it("exige nome e recusa orçamento inválido", () => {
    const base = {
      id: "",
      nome: "Semear",
      descricao: "",
      tipo: "PROJETO" as const,
      status: "Planejamento",
      orcamento: "",
      dataInicio: "",
      dataFim: "",
    }
    expect(() => paraProjetoPayload({ ...base, nome: " " })).toThrow(/nome/)
    expect(() => orcamentoParaApi("-10")).toThrow(/Orçamento/)
  })
})

describe("filtros", () => {
  const lista = [
    deProjetoApi({
      id: 1,
      nome: "Semear",
      descricao: "Contraturno",
      tipo: "PROJETO",
      status: "Em andamento",
      orcamentoTotal: null,
      dataInicio: null,
      dataFim: null,
    }),
    deProjetoApi({
      id: 2,
      nome: "Mais Educação",
      descricao: null,
      tipo: "PROGRAMA",
      status: "Concluído",
      orcamentoTotal: null,
      dataInicio: null,
      dataFim: null,
    }),
  ]

  it("filtra por tipo e situação", () => {
    expect(
      filtrarIniciativas(lista, { busca: "seme", tipo: "todos", status: "todos" }).map(
        (item) => item.id,
      ),
    ).toEqual(["1"])
    expect(
      filtrarIniciativas(lista, {
        busca: "",
        tipo: "PROGRAMA",
        status: "Concluído",
      }).map((item) => item.id),
    ).toEqual(["2"])
  })
})
