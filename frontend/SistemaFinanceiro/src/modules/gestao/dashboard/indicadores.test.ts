import { describe, expect, it } from "vitest"
import type { Compromisso } from "../agenda/types"
import { educandoVazio } from "../educandos/model"
import {
  cadastrosSemDocumento,
  compromissosAgendados,
  educandosAtivos,
  educandosPorIniciativa,
  hojeLocal,
  proximosCompromissos,
} from "./indicadores"

const educando = (dados: Partial<ReturnType<typeof educandoVazio>>) => ({
  ...educandoVazio(),
  situacaoVinculo: "Ativo" as const,
  ...dados,
})

const compromisso = (id: string, data: string, horario: string, status: Compromisso["status"] = "Agendado"): Compromisso => ({
  id, titulo: id, data, horario, status, local: "", responsavel: "", tipo: "Reunião", observacoes: "",
})

describe("indicadores do Dashboard", () => {
  it("usa a data local, não a UTC", () => {
    // 22h em Brasília já é o dia seguinte em UTC.
    expect(hojeLocal(new Date(2026, 10, 4, 22, 30))).toBe("2026-11-04")
  })

  it("conta educandos ativos e cadastros sem CPF ou NIS", () => {
    const lista = [
      educando({ cpf: "1", nis: "2" }),
      educando({ cpf: "1", nis: "" }),
      educando({ cpf: "", nis: "", situacaoVinculo: "Inativo" }),
    ]
    expect(educandosAtivos(lista)).toBe(2)
    expect(cadastrosSemDocumento(lista)).toBe(1)
  })

  it("lista só compromissos agendados de hoje em diante, em ordem", () => {
    const lista = [
      compromisso("ontem", "2026-11-03", "09:00"),
      compromisso("cancelado", "2026-11-05", "08:00", "Cancelado"),
      compromisso("amanha", "2026-11-05", "10:00"),
      compromisso("hoje-tarde", "2026-11-04", "15:00"),
      compromisso("hoje-cedo", "2026-11-04", "08:00"),
    ]
    expect(compromissosAgendados(lista, "2026-11-04")).toBe(3)
    expect(proximosCompromissos(lista, "2026-11-04").map((c) => c.id)).toEqual([
      "hoje-cedo",
      "hoje-tarde",
      "amanha",
    ])
  })

  it("conta educandos ativos por iniciativa", () => {
    const iniciativas = [
      { id: "1", codigo: "1", nome: "SCFV", tipo: "Serviço" as const, situacao: "Ativo" as const },
      { id: "2", codigo: "2", nome: "Música", tipo: "Projeto" as const, situacao: "Ativo" as const },
    ]
    const lista = [
      educando({ iniciativaId: "1" }),
      educando({ iniciativaId: "1", situacaoVinculo: "Inativo" }),
      educando({ iniciativaId: "2" }),
    ]
    expect(educandosPorIniciativa(lista, iniciativas).map((l) => l.ativos)).toEqual([1, 1])
  })
})
