import { describe, expect, it, vi } from "vitest"
import { educandoVazio, responsavelVazio } from "../educandos/model"
import type { Educando } from "../educandos/types"
import type { EducandoApi, ResponsavelApi } from "./educandos"
import { salvarEducandoRemoto, type ChamadasEducandos } from "./educandosFluxo"

function educandoApi(id: number, nome: string, responsaveis: ResponsavelApi[] = []): EducandoApi {
  return {
    id,
    organizacaoId: 1,
    nome,
    cpf: null,
    rg: null,
    nis: null,
    corAutodeclarada: null,
    dataNascimento: null,
    endereco: null,
    telefone: null,
    escola: null,
    turno: null,
    historicoRepetencia: null,
    numerosPessoasFamilias: null,
    rendaFamiliar: null,
    beneficiosSociais: null,
    tipoMoradia: null,
    doencaCronica: null,
    medicamentoContinuo: null,
    observacaoSaude: null,
    situacaoAtual: "ativo",
    tecnicoResponsavelId: null,
    responsaveis,
  }
}

function apiFalsa(): ChamadasEducandos {
  return {
    criarEducando: vi.fn(async (dados) => educandoApi(41, dados.nome)),
    atualizarEducando: vi.fn(async (id, dados) => educandoApi(id, dados.nome)),
    criarResponsavel: vi.fn(async (dados) => ({ id: 90, ...dados })),
    atualizarResponsavel: vi.fn(async (id, dados) => ({ id, ...dados })),
    criarVinculo: vi.fn(async (dados) => ({ id: 70, situacao: "ativo", dataIngresso: "2026-01-01T15:00:00.000Z", ...dados })),
    atualizarVinculo: vi.fn(async (id) => ({ id, educandoId: 1, projetoId: 1, situacao: "ativo", dataIngresso: "2026-01-01T15:00:00.000Z" })),
    encerrarVinculo: vi.fn(async (id) => ({ id, educandoId: 1, projetoId: 1, situacao: "encerrado", dataIngresso: "2026-01-01T15:00:00.000Z" })),
    buscarEducando: vi.fn(async (id) =>
      educandoApi(id, "Lido do servidor", [
        {
          id: 90,
          educandoId: id,
          nome: "Mãe",
          vinculo: "Mãe",
          cpf: null,
          rg: null,
          telefone: null,
          profissao: null,
          tipoTrabalho: null,
          localTrabalho: null,
          escolaridade: null,
        },
      ]),
    ),
  }
}

describe("salvarEducandoRemoto", () => {
  it("cria educando, cria responsável com o id novo e relê a ficha", async () => {
    const api = apiFalsa()
    const novo: Educando = {
      ...educandoVazio(),
      nome: "Bia",
      responsaveis: [{ ...responsavelVazio(), nome: "Mãe", vinculo: "Mãe" }],
    }

    const salvo = await salvarEducandoRemoto(novo, [], api)

    expect(api.criarEducando).toHaveBeenCalledOnce()
    expect(api.atualizarEducando).not.toHaveBeenCalled()
    expect(api.criarResponsavel).toHaveBeenCalledWith(
      expect.objectContaining({ educandoId: 41, nome: "Mãe" }),
    )
    expect(api.buscarEducando).toHaveBeenCalledWith(41)
    expect(salvo).toMatchObject({ id: "41", nome: "Lido do servidor" })
    expect(salvo.responsaveis[0].id).toBe("90")
  })

  it("atualiza educando e responsável existentes pelo id numérico", async () => {
    const api = apiFalsa()
    const existente: Educando = {
      ...educandoVazio(),
      id: "12",
      nome: "Caio",
      responsaveis: [{ ...responsavelVazio("90"), nome: "Pai", vinculo: "Pai" }],
    }

    await salvarEducandoRemoto(existente, [existente], api)

    expect(api.atualizarEducando).toHaveBeenCalledWith(12, expect.objectContaining({ nome: "Caio" }))
    expect(api.atualizarResponsavel).toHaveBeenCalledWith(
      90,
      expect.objectContaining({ educandoId: 12, nome: "Pai" }),
    )
    expect(api.criarEducando).not.toHaveBeenCalled()
  })

  it("não chama a API quando o CPF já pertence a outro educando", async () => {
    const api = apiFalsa()
    const outro: Educando = { ...educandoVazio(), id: "3", nome: "Outro", cpf: "123.456.789-09" }
    const novo: Educando = { ...educandoVazio(), nome: "Novo", cpf: "12345678909" }

    await expect(salvarEducandoRemoto(novo, [outro], api)).rejects.toThrow()
    expect(api.criarEducando).not.toHaveBeenCalled()
  })

  it("não chama a API quando um responsável está incompleto", async () => {
    const api = apiFalsa()
    const novo: Educando = {
      ...educandoVazio(),
      nome: "Dani",
      responsaveis: [{ ...responsavelVazio(), nome: "Tio" }],
    }

    await expect(salvarEducandoRemoto(novo, [], api)).rejects.toThrow(/nome e vínculo/)
    expect(api.criarEducando).not.toHaveBeenCalled()
  })

  it("cria o vínculo com a iniciativa escolhida no cadastro", async () => {
    const api = apiFalsa()
    await salvarEducandoRemoto(
      { ...educandoVazio(), nome: "Lia", iniciativaId: "5", dataIngresso: "2026-03-10" },
      [],
      api,
    )
    expect(api.criarVinculo).toHaveBeenCalledWith(
      expect.objectContaining({ educandoId: 41, projetoId: 5 }),
    )
    expect(api.encerrarVinculo).not.toHaveBeenCalled()
  })

  it("trocar de iniciativa encerra o vínculo antigo e cria outro", async () => {
    const api = apiFalsa()
    const gravado = { ...educandoVazio(), id: "12", nome: "Caio", iniciativaId: "5", dataIngresso: "2026-03-10", vinculoId: "70" }
    await salvarEducandoRemoto({ ...gravado, iniciativaId: "8" }, [gravado], api)
    expect(api.encerrarVinculo).toHaveBeenCalledWith(70)
    expect(api.criarVinculo).toHaveBeenCalledWith(expect.objectContaining({ educandoId: 12, projetoId: 8 }))
  })
})
