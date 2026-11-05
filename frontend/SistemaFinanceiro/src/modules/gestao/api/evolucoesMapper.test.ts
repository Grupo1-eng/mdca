import { describe, expect, it } from "vitest"
import { situacaoAtualEncaminhamento } from "../educandos/model"
import { CAMPOS_AGUARDANDO_MIGRACAO } from "./educandosMapper"
import {
  agoraLocal,
  dataHoraLocalParaIso,
  dataLocalParaIso,
  deEncaminhamentoApi,
  deEvolucaoApi,
  isoParaDataHoraLocal,
  isoParaDataLocal,
  paraAcompanhamentoPayload,
  paraEncaminhamentoPayload,
  paraEvolucaoPayload,
  statusParaApi,
  statusParaTela,
} from "./evolucoesMapper"

describe("datas", () => {
  it("vai e volta entre o fuso do navegador e UTC sem perder minutos", () => {
    const iso = dataHoraLocalParaIso("2026-10-29T14:30")
    expect(isoParaDataHoraLocal(iso)).toBe("2026-10-29T14:30")
  })

  it("data sem hora não muda de dia ao passar por UTC", () => {
    expect(isoParaDataLocal(dataLocalParaIso("2026-10-01"))).toBe("2026-10-01")
  })

  it("agora local não usa o horário UTC", () => {
    // 21h47 em Brasília já é 00h47 do dia seguinte em UTC.
    expect(agoraLocal(new Date(2026, 10, 4, 21, 47))).toBe("2026-11-04T21:47")
  })

  it("recusa data inválida", () => {
    expect(() => dataHoraLocalParaIso("ontem")).toThrow(/inválidas/)
  })
})

describe("situação do encaminhamento", () => {
  it("converte entre o texto do backend e o da tela", () => {
    expect(statusParaTela("em andamento")).toBe("Em andamento")
    expect(statusParaTela("PENDENTE")).toBe("Pendente")
    expect(statusParaTela("efetivado")).toBe("Efetivado")
    expect(statusParaTela(null)).toBe("Em andamento")
    expect(statusParaApi("Em andamento")).toBe("em andamento")
  })
})

describe("deEvolucaoApi", () => {
  it("usa o nome do profissional e a descrição como registro", () => {
    const atendimento = deEvolucaoApi({
      id: 5,
      educandoId: 1,
      projetoId: null,
      profissionalId: 9,
      titulo: null,
      tipo: "atendimento",
      descricao: "Conversa com a família",
      dataInicio: dataHoraLocalParaIso("2026-10-20T09:00"),
      dataFim: null,
      situacao: "aberta",
      profissional: { id: 9, nome: "Helena" },
    })
    expect(atendimento).toEqual({
      id: "5",
      educandoId: "1",
      profissional: "Helena",
      perfilProfissional: "",
      dataHora: "2026-10-20T09:00",
      registro: "Conversa com a família",
      intervencaoUsuario: "",
      intervencaoFamilia: "",
      sigiloso: false,
    })
  })
})

describe("deEncaminhamentoApi", () => {
  const base = {
    id: 3,
    educandoId: 1,
    evolucaoId: null,
    dataEncaminhamento: dataHoraLocalParaIso("2026-10-01T10:00"),
    situacaoAtual: "em andamento",
  }

  it("sem acompanhamentos, a situação vem do servidor", () => {
    const enc = deEncaminhamentoApi({ ...base, acompanhamentos: [] })
    expect(enc.situacao).toBe("Em andamento")
    expect(situacaoAtualEncaminhamento(enc)).toBe("Em andamento")
  })

  it("o motivo da tela é a descricao do banco, e o autor vem do servidor", () => {
    const enc = deEncaminhamentoApi({
      ...base,
      descricao: "Atendimento especializado",
      destino: "CAPS Infantil",
      profissional: { id: 7, nome: "Ana" },
    })
    expect(enc).toMatchObject({ motivo: "Atendimento especializado", destino: "CAPS Infantil", profissional: "Ana" })
  })

  it("com acompanhamentos, vale o mais recente", () => {
    const enc = deEncaminhamentoApi({
      ...base,
      acompanhamentos: [
        { id: 2, encaminhamentoId: 3, situacao: "efetivado", data: dataLocalParaIso("2026-10-10"), observacao: "Vaga" },
        { id: 1, encaminhamentoId: 3, situacao: "pendente", data: dataLocalParaIso("2026-10-05"), observacao: null },
      ],
    })
    expect(enc.acompanhamentos.map((a) => a.id)).toEqual(["2", "1"])
    expect(enc.acompanhamentos[1].observacao).toBe("")
    expect(situacaoAtualEncaminhamento(enc)).toBe("Efetivado")
  })
})

describe("payloads", () => {
  it("evolução: não envia profissional e exige registro", () => {
    const form = {
      dataHora: "2026-10-29T08:15",
      registro: "  Atendimento inicial ",
      intervencaoUsuario: "x",
      intervencaoFamilia: "y",
      sigiloso: true,
    }
    const payload = paraEvolucaoPayload("4", form)
    expect(payload).toMatchObject({ educandoId: 4, descricao: "Atendimento inicial", tipo: "atendimento" })
    expect(payload).not.toHaveProperty("profissionalId")
    expect(isoParaDataHoraLocal(payload.dataInicio)).toBe("2026-10-29T08:15")
    if (CAMPOS_AGUARDANDO_MIGRACAO) expect(payload).not.toHaveProperty("sigiloso")
    else
      expect(payload).toMatchObject({ intervencaoUsuario: "x", intervencaoFamilia: "y", sigiloso: true })
    expect(() => paraEvolucaoPayload("4", { ...form, registro: " " })).toThrow(/Descreva/)
  })

  it("encaminhamento: motivo vai na descricao quando a migration estiver no banco", () => {
    const payload = paraEncaminhamentoPayload("4", { destino: "CRAS", motivo: " Vulnerabilidade " })
    if (CAMPOS_AGUARDANDO_MIGRACAO) {
      expect(payload).not.toHaveProperty("descricao")
    } else {
      expect(payload).toMatchObject({ destino: "CRAS", descricao: "Vulnerabilidade" })
      expect(payload).not.toHaveProperty("motivo")
    }
  })

  it("encaminhamento: usa o instante atual", () => {
    const agora = new Date("2026-10-29T12:00:00Z")
    expect(paraEncaminhamentoPayload("4", { destino: "CRAS", motivo: "" }, agora)).toMatchObject({
      educandoId: 4,
      dataEncaminhamento: "2026-10-29T12:00:00.000Z",
    })
  })

  it("acompanhamento: situação em minúsculas e observação obrigatória", () => {
    const form = { data: "2026-10-29", situacao: "Efetivado" as const, observacao: " Vaga confirmada " }
    expect(paraAcompanhamentoPayload("3", form)).toMatchObject({
      encaminhamentoId: 3,
      situacao: "efetivado",
      observacao: "Vaga confirmada",
    })
    expect(() => paraAcompanhamentoPayload("3", { ...form, observacao: "" })).toThrow(/Descreva/)
  })
})
