import { describe, expect, it } from "vitest"
import {
  deAtividadeApi,
  deChamadaApi,
  deEncontroApi,
  deFrequenciaApi,
  paraAtividadePayload,
  paraEncontroPayload,
  paraRegistroChamada,
  resumoFrequencia,
} from "./atividadesMapper"

describe("atividades", () => {
  const api = {
    id: 3,
    projetoId: 5,
    responsavelId: 7,
    nome: "Oficina",
    descricao: null,
    situacao: "encerrada",
    projeto: { id: 5, nome: "Semear" },
    responsavel: { id: 7, nome: "Paula" },
    encontros: [{ situacao: "realizado" }, { situacao: "cancelado" }, { situacao: "agendado" }],
  }

  it("converte a atividade e conta só os encontros realizados (RN05)", () => {
    expect(deAtividadeApi(api)).toEqual({
      id: "3",
      nome: "Oficina",
      iniciativaId: "5",
      iniciativaNome: "Semear",
      responsavelId: "7",
      responsavelNome: "Paula",
      situacao: "Encerrada",
      descricao: "",
      encontrosTotal: 3,
      encontrosRealizados: 1,
    })
  })

  it("monta o envio com ids numéricos e situação minúscula", () => {
    expect(paraAtividadePayload({ ...deAtividadeApi(api), nome: " Oficina ", descricao: "  " })).toEqual({
      projetoId: 5,
      responsavelId: 7,
      nome: "Oficina",
      descricao: null,
      situacao: "encerrada",
    })
  })
})

describe("encontros", () => {
  it("lê a data só como dia e traduz a situação", () => {
    const encontro = deEncontroApi({
      id: 9,
      atividadeId: 3,
      dataInicio: "2026-11-20T00:00:00.000Z",
      horaInicio: "14:00",
      horaFim: null,
      local: null,
      observacoes: null,
      situacao: "agendado",
      _count: { frequencias: 4 },
    })
    expect(encontro).toEqual({
      id: "9",
      atividadeId: "3",
      data: "2026-11-20",
      horaInicio: "14:00",
      horaFim: "",
      local: "",
      observacoes: "",
      situacao: "Planejado",
      presencasRegistradas: 4,
    })
    expect(paraEncontroPayload({ ...encontro, situacao: "Cancelado", local: " Sala 2 " })).toEqual({
      data: "2026-11-20",
      horaInicio: "14:00",
      horaFim: null,
      local: "Sala 2",
      observacoes: null,
      situacao: "cancelado",
    })
  })
})

describe("frequência", () => {
  it("envia só quem tem presença ou ausência marcada", () => {
    const { linhas } = deChamadaApi({
      aceitaChamada: true,
      linhas: [
        { educandoId: 1, nome: "Ana", presente: true, observacao: null, desvinculado: false },
        { educandoId: 2, nome: "Bia", presente: null, observacao: null, desvinculado: false },
        { educandoId: 3, nome: "Caio", presente: false, observacao: "doente", desvinculado: true },
      ],
    })
    expect(paraRegistroChamada(linhas)).toEqual({
      registros: [
        { educandoId: 1, presente: true, observacao: null },
        { educandoId: 3, presente: false, observacao: "doente" },
      ],
    })
  })

  it("calcula a taxa só sobre encontros realizados", () => {
    const registro = (situacao: string, presencaAusencia: string) =>
      deFrequenciaApi({
        presencaAusencia,
        observacao: null,
        encontro: {
          id: 1,
          dataInicio: "2026-11-20T00:00:00.000Z",
          horaInicio: null,
          situacao,
          atividade: { nome: "Oficina", projeto: { nome: "Semear" } },
        },
      })
    const registros = [
      registro("realizado", "presente"),
      registro("realizado", "ausente"),
      registro("realizado", "presente"),
      registro("cancelado", "ausente"),
      registro("agendado", "presente"),
    ]
    expect(registros[0]).toMatchObject({ data: "2026-11-20", atividadeNome: "Oficina", iniciativaNome: "Semear", presente: true })
    expect(resumoFrequencia(registros)).toEqual({ realizados: 3, presentes: 2, taxa: 67 })
    expect(resumoFrequencia([]).taxa).toBeNull()
  })
})
