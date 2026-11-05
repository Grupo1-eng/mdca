import { describe, expect, it } from "vitest"
import { CAMPOS_AGUARDANDO_MIGRACAO } from "./educandosMapper"
import {
  deCompromissoApi,
  paraCompromissoPayload,
  situacaoParaApi,
  situacaoParaTela,
  tipoParaTela,
} from "./compromissosMapper"
import { dataHoraLocalParaIso, isoParaDataHoraLocal } from "./evolucoesMapper"

describe("situação e tipo", () => {
  it("converte a situação nos dois sentidos", () => {
    expect(situacaoParaTela("agendado")).toBe("Agendado")
    expect(situacaoParaTela("REALIZADO")).toBe("Realizado")
    expect(situacaoParaTela("cancelado")).toBe("Cancelado")
    expect(situacaoParaApi("Realizado")).toBe("realizado")
  })

  it("mantém tipos conhecidos e usa Reunião para os demais", () => {
    expect(tipoParaTela("Visita domiciliar")).toBe("Visita domiciliar")
    expect(tipoParaTela("reuniao de equipe")).toBe("Reunião")
    expect(tipoParaTela(null)).toBe("Reunião")
  })
})

describe("deCompromissoApi", () => {
  it("separa data e horário no fuso do navegador e usa o criador como responsável", () => {
    const compromisso = deCompromissoApi({
      id: 8,
      criadorId: 2,
      titulo: "Reunião de rede",
      tipo: "Reunião",
      descricao: "Pauta CRAS",
      dataInicio: dataHoraLocalParaIso("2026-11-03T15:45"),
      dataFim: null,
      situacao: "cancelado",
      criador: { id: 2, nome: "Helena" },
    })
    expect(compromisso).toEqual({
      id: "8",
      titulo: "Reunião de rede",
      data: "2026-11-03",
      horario: "15:45",
      local: "",
      responsavel: "Helena",
      tipo: "Reunião",
      status: "Cancelado",
      observacoes: "Pauta CRAS",
    })
  })
})

describe("paraCompromissoPayload", () => {
  const dados = {
    titulo: "  Visita  ",
    data: "2026-11-04",
    horario: "09:30",
    local: "Casa da família",
    tipo: "Visita domiciliar" as const,
    observacoes: "",
  }

  it("junta data e horário em ISO e não envia responsável nem situação", () => {
    const payload = paraCompromissoPayload(dados)
    expect(payload).toMatchObject({ titulo: "Visita", tipo: "Visita domiciliar", descricao: null })
    expect(isoParaDataHoraLocal(payload.dataInicio)).toBe("2026-11-04T09:30")
    expect(payload).not.toHaveProperty("situacao")
    expect(payload).not.toHaveProperty("criadorId")
    if (CAMPOS_AGUARDANDO_MIGRACAO) expect(payload).not.toHaveProperty("local")
    else expect(payload).toMatchObject({ local: "Casa da família" })
  })

  it("exige título e data", () => {
    expect(() => paraCompromissoPayload({ ...dados, titulo: " " })).toThrow(/título e data/)
    expect(() => paraCompromissoPayload({ ...dados, data: "" })).toThrow(/título e data/)
  })
})
