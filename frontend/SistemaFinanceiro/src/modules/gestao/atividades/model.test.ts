import { describe, expect, it } from "vitest"
import { atividadesSeed, encontrosSeed } from "../educandos/data/mock"
import type { Atividade } from "../educandos/types"
import {
  atividadeVazia,
  contarEncontros,
  filtrarAtividades,
  permissoesAtividades,
  salvarAtividadeEmMemoria,
  validarAtividade,
} from "./model"

const encerrada: Atividade = {
  id: "atv-x",
  nome: "Oficina de Teatro",
  iniciativaId: "ini-2",
  responsavel: "Educadora Paula Menezes",
  situacao: "Encerrada",
  descricao: "",
}
const atividades = [...atividadesSeed, encerrada]

describe("contarEncontros", () => {
  it("conta só os encontros da atividade", () => {
    const esperado = encontrosSeed.filter((e) => e.atividadeId === "atv-1").length
    expect(contarEncontros(encontrosSeed, "atv-1")).toBe(esperado)
    expect(contarEncontros(encontrosSeed, "atv-inexistente")).toBe(0)
  })
})

describe("filtrarAtividades", () => {
  it("sem filtros devolve todas", () => {
    expect(filtrarAtividades(atividades, "", "todas", "todas")).toHaveLength(
      atividades.length,
    )
  })

  it("busca por nome ou responsável, sem diferenciar maiúsculas", () => {
    expect(
      filtrarAtividades(atividades, "música", "todas", "todas").map((a) => a.id),
    ).toEqual(["atv-1"])
    expect(
      filtrarAtividades(atividades, "  PAULA ", "todas", "todas").map((a) => a.id),
    ).toEqual(["atv-2", "atv-x"])
  })

  it("filtra por iniciativa e por situação", () => {
    expect(
      filtrarAtividades(atividades, "", "ini-2", "todas").map((a) => a.id),
    ).toEqual(["atv-2", "atv-x"])
    expect(
      filtrarAtividades(atividades, "", "ini-2", "Encerrada").map((a) => a.id),
    ).toEqual(["atv-x"])
  })
})

describe("permissoesAtividades", () => {
  it("só coordenação e educador registram atividades", () => {
    expect(permissoesAtividades("coordenador").registrarAtividade).toBe(true)
    expect(permissoesAtividades("educador").registrarAtividade).toBe(true)
    expect(permissoesAtividades("tecnico_servico_social").registrarAtividade).toBe(false)
    expect(permissoesAtividades("tecnico_psicologia").registrarAtividade).toBe(false)
    expect(permissoesAtividades("administrativo").registrarAtividade).toBe(false)
    expect(permissoesAtividades(undefined).registrarAtividade).toBe(false)
  })
})

describe("validarAtividade", () => {
  const valida: Atividade = { ...atividadeVazia("Ana"), id: "atv-n", nome: "Coral", iniciativaId: "ini-1" }

  it("aceita atividade com nome, iniciativa e responsável", () => {
    expect(validarAtividade(valida)).toBeNull()
  })

  it("exige nome, iniciativa e responsável", () => {
    expect(validarAtividade({ ...valida, nome: "   " })).toMatch(/nome/)
    expect(validarAtividade({ ...valida, iniciativaId: "" })).toMatch(/projeto/)
    expect(validarAtividade({ ...valida, responsavel: "" })).toMatch(/responsável/)
  })
})

describe("salvarAtividadeEmMemoria", () => {
  const nova: Atividade = {
    ...atividadeVazia(" Ana "),
    id: "atv-n",
    nome: " Coral ",
    iniciativaId: "ini-1",
  }

  it("cria uma atividade nova com textos aparados", () => {
    const resultado = salvarAtividadeEmMemoria(atividadesSeed, nova)
    expect(resultado).toHaveLength(atividadesSeed.length + 1)
    expect(resultado.at(-1)).toMatchObject({ nome: "Coral", responsavel: "Ana" })
  })

  it("atualiza a atividade existente sem duplicar", () => {
    const editada = { ...atividadesSeed[0], situacao: "Encerrada" as const }
    const resultado = salvarAtividadeEmMemoria(atividadesSeed, editada)
    expect(resultado).toHaveLength(atividadesSeed.length)
    expect(resultado[0].situacao).toBe("Encerrada")
  })

  it("lança erro e não altera a lista quando inválida", () => {
    expect(() => salvarAtividadeEmMemoria(atividadesSeed, { ...nova, nome: "" })).toThrow(
      "Informe o nome da atividade.",
    )
  })
})
