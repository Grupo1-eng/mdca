import { describe, expect, it } from "vitest"
import {
  compromissosDaVisao,
  criarCompromissoEmMemoria,
  editarCompromissoEmMemoria,
  mudarStatusCompromissoEmMemoria,
  navegarPeriodo,
} from "./model"
import type { Compromisso } from "./types"

const compromissoBase: Compromisso = {
  id: "cmp-base",
  titulo: "Reunião de equipe",
  data: "2026-10-08",
  horario: "09:00",
  local: "Sala 1",
  responsavel: "Helena Martins",
  tipo: "Reunião",
  status: "Agendado",
  observacoes: "Pauta semanal",
}

describe("Agenda temporária", () => {
  it("navega entre períodos de dia, semana e mês", () => {
    expect(navegarPeriodo("2026-10-08", "dia", 1)).toBe("2026-10-09")
    expect(navegarPeriodo("2026-10-08", "semana", -1)).toBe("2026-10-01")
    expect(navegarPeriodo("2026-10-08", "mes", 1)).toBe("2026-11-08")
  })

  it("alterna as visualizações preservando a filtragem do protótipo", () => {
    const compromissos: Compromisso[] = [
      compromissoBase,
      { ...compromissoBase, id: "cmp-dia-seguinte", data: "2026-10-09" },
      { ...compromissoBase, id: "cmp-outro-mes", data: "2026-11-02" },
    ]

    expect(compromissosDaVisao(compromissos, "2026-10-08", "dia")).toHaveLength(
      1,
    )
    expect(
      compromissosDaVisao(compromissos, "2026-10-08", "semana"),
    ).toHaveLength(2)
    expect(compromissosDaVisao(compromissos, "2026-10-08", "mes")).toHaveLength(
      2,
    )
  })

  it("cria compromisso com os campos obrigatórios", () => {
    const resultado = criarCompromissoEmMemoria([], compromissoBase)
    expect(resultado).toEqual([compromissoBase])
    expect(() =>
      criarCompromissoEmMemoria([], { ...compromissoBase, titulo: "" }),
    ).toThrow("O compromisso precisa de título, data e responsável.")
  })

  it("edita somente os campos editáveis e preserva responsável e status", () => {
    const [editado] = editarCompromissoEmMemoria(
      [compromissoBase],
      compromissoBase.id,
      {
        titulo: "Reunião atualizada",
        data: "2026-10-09",
        horario: "10:30",
        local: "Sala 2",
        tipo: "Atendimento",
        observacoes: "Nova pauta",
      },
    )

    expect(editado).toMatchObject({
      titulo: "Reunião atualizada",
      responsavel: "Helena Martins",
      status: "Agendado",
    })
  })

  it("marca compromisso como realizado ou cancelado sem removê-lo", () => {
    const realizados = mudarStatusCompromissoEmMemoria(
      [compromissoBase],
      compromissoBase.id,
      "Realizado",
    )
    expect(realizados[0].status).toBe("Realizado")

    const cancelados = mudarStatusCompromissoEmMemoria(
      realizados,
      compromissoBase.id,
      "Cancelado",
    )
    expect(cancelados).toHaveLength(1)
    expect(cancelados[0].status).toBe("Cancelado")
  })
})
