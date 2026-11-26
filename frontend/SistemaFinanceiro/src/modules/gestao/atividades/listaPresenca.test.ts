import { describe, expect, it } from "vitest"
import type { ListaPresencaApi } from "../api/atividades"
import { gerarCsvListaPresenca, nomeArquivoLista } from "./listaPresenca"

const lista: ListaPresencaApi = {
  atividade: { id: 4, nome: "Oficina de Música; Ritmo", iniciativa: { id: 5, nome: "Projeto Som" } },
  periodo: { inicio: "2026-11-01", fim: "2026-11-30" },
  encontros: [
    { id: 10, dataInicio: "2026-11-03T00:00:00.000Z", horaInicio: "14:00", situacao: "realizado" },
    { id: 11, dataInicio: "2026-11-10T00:00:00.000Z", horaInicio: null, situacao: "agendado" },
  ],
  linhas: [
    { educandoId: 2, nome: "Ana", presencas: {}, totalPresencas: 0, totalAusencias: 0 },
    { educandoId: 1, nome: "Bia", presencas: { 10: true, 11: false }, totalPresencas: 1, totalAusencias: 1 },
  ],
}

describe("lista de presença em CSV", () => {
  it("monta a grade com P/F, totais e frequência, com ; e BOM", () => {
    const csv = gerarCsvListaPresenca(lista)
    expect(csv.startsWith("﻿")).toBe(true)
    const linhas = csv.replace("﻿", "").trimEnd().split("\r\n")
    expect(linhas[0]).toBe("Lista de presença — MDCA")
    expect(linhas[1]).toBe('"Atividade: Oficina de Música; Ritmo"')
    expect(linhas[3]).toBe("Período: 01/11/2026 a 30/11/2026")
    expect(linhas[6]).toBe("Educando;03/11/2026 14:00;10/11/2026 (planejado);Presenças;Faltas;Frequência")
    expect(linhas[7]).toBe("Ana;;;0;0;—")
    expect(linhas[8]).toBe("Bia;P;F;1;1;50,0%")
  })

  it("dá nome de arquivo sem acento nem espaço", () => {
    expect(nomeArquivoLista(lista)).toBe(
      "lista-presenca-oficina-de-musica-ritmo-2026-11-01-a-2026-11-30.csv",
    )
  })
})
