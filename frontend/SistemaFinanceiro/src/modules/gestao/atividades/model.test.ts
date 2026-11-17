import { describe, expect, it } from "vitest"
import type { Atividade, Encontro, LinhaChamada } from "../educandos/types"
import {
  aceitaChamada,
  aceitaEncontroNovo,
  atividadeVazia,
  dataVisivel,
  encontroVazio,
  filtrarAtividades,
  hojeLocal,
  marcarRestantesPresentes,
  permissoesAtividades,
  resumoChamada,
  validarAtividade,
  validarEncontro,
} from "./model"

const atividade = (dados: Partial<Atividade>): Atividade => ({
  ...atividadeVazia(),
  id: "1",
  nome: "Oficina de música",
  iniciativaId: "5",
  responsavelId: "7",
  responsavelNome: "Paula Souza",
  ...dados,
})

describe("filtrarAtividades", () => {
  const lista = [
    atividade({ id: "1" }),
    atividade({ id: "2", nome: "Futebol", responsavelNome: "Caio", iniciativaId: "6" }),
    atividade({ id: "3", nome: "Teatro", iniciativaId: "6", situacao: "Encerrada" }),
  ]

  it("sem filtros, devolve todas", () => {
    expect(filtrarAtividades(lista, "", "todas", "todas")).toHaveLength(3)
  })

  it("busca por nome ou responsável, sem diferenciar maiúsculas", () => {
    expect(filtrarAtividades(lista, "MÚSICA", "todas", "todas").map((a) => a.id)).toEqual(["1"])
    expect(filtrarAtividades(lista, "  paula ", "todas", "todas").map((a) => a.id)).toEqual(["1", "3"])
  })

  it("filtra por iniciativa e situação", () => {
    expect(filtrarAtividades(lista, "", "6", "todas").map((a) => a.id)).toEqual(["2", "3"])
    expect(filtrarAtividades(lista, "", "6", "Encerrada").map((a) => a.id)).toEqual(["3"])
  })
})

describe("permissões", () => {
  it("só coordenação e educador registram atividades, encontros e chamada", () => {
    expect(permissoesAtividades("coordenador").registrarAtividade).toBe(true)
    expect(permissoesAtividades("educador").registrarAtividade).toBe(true)
    for (const perfil of ["tecnico_servico_social", "tecnico_psicologia", "administrativo", undefined] as const) {
      expect(permissoesAtividades(perfil).registrarAtividade).toBe(false)
    }
  })
})

describe("validarAtividade", () => {
  it("exige nome, iniciativa e responsável (RF17)", () => {
    expect(validarAtividade(atividade({}))).toBeNull()
    expect(validarAtividade(atividade({ nome: " " }))).toMatch(/nome/)
    expect(validarAtividade(atividade({ iniciativaId: "" }))).toMatch(/projeto/)
    expect(validarAtividade(atividade({ responsavelId: "" }))).toMatch(/responsável/)
  })
})

describe("regras das decisões", () => {
  it("atividade encerrada não aceita encontro novo (decisão 3)", () => {
    expect(aceitaEncontroNovo({ situacao: "Ativa" })).toBe(true)
    expect(aceitaEncontroNovo({ situacao: "Encerrada" })).toBe(false)
  })

  it("chamada em qualquer encontro não cancelado (decisão 1, provisória)", () => {
    expect(aceitaChamada({ situacao: "Planejado" })).toBe(true)
    expect(aceitaChamada({ situacao: "Realizado" })).toBe(true)
    expect(aceitaChamada({ situacao: "Cancelado" })).toBe(false)
  })
})

describe("validarEncontro", () => {
  const base: Encontro = { ...encontroVazio("1", "2026-11-20"), horaInicio: "14:00", horaFim: "15:30" }

  it("aceita um encontro completo e um só com a data", () => {
    expect(validarEncontro(base)).toBeNull()
    expect(validarEncontro(encontroVazio("1", "2026-11-20"))).toBeNull()
  })

  it("exige data e horários válidos, com término depois do início", () => {
    expect(validarEncontro({ ...base, data: "" })).toMatch(/data/)
    expect(validarEncontro({ ...base, horaInicio: "9h" })).toMatch(/início/)
    expect(validarEncontro({ ...base, horaFim: "13:00" })).toMatch(/depois do início/)
  })

  it("novo encontro começa planejado", () => {
    expect(encontroVazio("1", "2026-11-20").situacao).toBe("Planejado")
  })
})

describe("chamada", () => {
  const linhas: LinhaChamada[] = [
    { educandoId: "1", nome: "Ana", presente: true, observacao: "", desvinculado: false },
    { educandoId: "2", nome: "Bia", presente: false, observacao: "", desvinculado: false },
    { educandoId: "3", nome: "Caio", presente: null, observacao: "", desvinculado: false },
  ]

  it("resume presentes, ausentes e sem registro", () => {
    expect(resumoChamada(linhas)).toEqual({ presentes: 1, ausentes: 1, semRegistro: 1 })
  })

  it("marca como presentes só quem ainda não tem registro", () => {
    expect(marcarRestantesPresentes(linhas).map((l) => l.presente)).toEqual([true, false, true])
  })
})

describe("datas", () => {
  it("mostra a data como DD/MM/AAAA", () => {
    expect(dataVisivel("2026-11-20")).toBe("20/11/2026")
    expect(dataVisivel("")).toBe("—")
  })

  it("hoje no fuso local, sem passar pelo UTC", () => {
    expect(hojeLocal(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05")
  })
})
