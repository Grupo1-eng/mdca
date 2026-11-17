import type { Perfil } from "@/types/financeiro"
import type { Atividade, Encontro, LinhaChamada } from "../educandos/types"

// "todas" desliga o filtro de iniciativa ou de situação.
export function filtrarAtividades(
  atividades: Atividade[],
  busca: string,
  iniciativaId: string,
  situacao: string,
): Atividade[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR")
  return atividades.filter(
    (atividade) =>
      (!termo ||
        atividade.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        atividade.responsavelNome.toLocaleLowerCase("pt-BR").includes(termo)) &&
      (iniciativaId === "todas" || atividade.iniciativaId === iniciativaId) &&
      (situacao === "todas" || atividade.situacao === situacao),
  )
}

export interface PermissoesAtividades {
  registrarAtividade: boolean
}

// Documento da Sprint 1, seção 3.1, e PERFIS_REGISTRO_ATIVIDADES do backend:
// coordenação e educador registram atividades, encontros e chamada, em
// qualquer atividade da organização (decisão 2, 2026-11-17).
export function permissoesAtividades(
  perfil: Perfil | undefined,
): PermissoesAtividades {
  return {
    registrarAtividade: perfil === "coordenador" || perfil === "educador",
  }
}

export function atividadeVazia(responsavelId = ""): Atividade {
  return {
    id: "",
    nome: "",
    iniciativaId: "",
    iniciativaNome: "",
    responsavelId,
    responsavelNome: "",
    situacao: "Ativa",
    descricao: "",
    encontrosTotal: 0,
    encontrosRealizados: 0,
  }
}

// RF17: toda atividade precisa de nome, iniciativa e responsável.
export function validarAtividade(atividade: Atividade): string | null {
  if (!atividade.nome.trim()) return "Informe o nome da atividade."
  if (!atividade.iniciativaId)
    return "Selecione o projeto, serviço ou programa da atividade."
  if (!atividade.responsavelId) return "Selecione o responsável."
  return null
}

// Decisão 3: atividade encerrada não aceita encontros novos (pode ser reaberta).
export function aceitaEncontroNovo(atividade: Pick<Atividade, "situacao">): boolean {
  return atividade.situacao !== "Encerrada"
}

// Decisão 1 (em aberto): por ora, chamada em qualquer encontro não cancelado.
// Espelha `aceitaChamada` do backend (regras-atividades.ts).
export function aceitaChamada(encontro: Pick<Encontro, "situacao">): boolean {
  return encontro.situacao !== "Cancelado"
}

export function encontroVazio(atividadeId: string, hoje: string): Encontro {
  return {
    id: "",
    atividadeId,
    data: hoje,
    horaInicio: "",
    horaFim: "",
    local: "",
    observacoes: "",
    situacao: "Planejado",
    presencasRegistradas: 0,
  }
}

const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/

export function validarEncontro(encontro: Encontro): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(encontro.data)) return "Informe a data do encontro."
  if (encontro.horaInicio && !HORARIO.test(encontro.horaInicio))
    return "O horário de início deve estar no formato HH:MM."
  if (encontro.horaFim && !HORARIO.test(encontro.horaFim))
    return "O horário de término deve estar no formato HH:MM."
  if (encontro.horaInicio && encontro.horaFim && encontro.horaFim <= encontro.horaInicio)
    return "O término deve ser depois do início."
  return null
}

export function resumoChamada(linhas: LinhaChamada[]) {
  return {
    presentes: linhas.filter((l) => l.presente === true).length,
    ausentes: linhas.filter((l) => l.presente === false).length,
    semRegistro: linhas.filter((l) => l.presente === null).length,
  }
}

// Marca todos os ainda sem registro como presentes (atalho da chamada).
export function marcarRestantesPresentes(linhas: LinhaChamada[]): LinhaChamada[] {
  return linhas.map((l) => (l.presente === null ? { ...l, presente: true } : l))
}

export function dataVisivel(valor: string): string {
  const [ano, mes, dia] = valor.split("-")
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—"
}

// Hoje no fuso do navegador, como AAAA-MM-DD.
export function hojeLocal(agora = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, "0")
  const dia = String(agora.getDate()).padStart(2, "0")
  return `${agora.getFullYear()}-${mes}-${dia}`
}
