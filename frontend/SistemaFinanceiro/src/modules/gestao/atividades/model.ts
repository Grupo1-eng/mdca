import type { Perfil } from "@/types/financeiro"
import type { Atividade, Encontro } from "../educandos/types"

export function contarEncontros(
  encontros: Encontro[],
  atividadeId: string,
): number {
  return encontros.filter((encontro) => encontro.atividadeId === atividadeId)
    .length
}

// "todas" desliga o filtro de iniciativa ou de situação.
export function filtrarAtividades(
  atividades: Atividade[],
  busca: string,
  iniciativaId: string,
  situacao: string,
): Atividade[] {
  const termo = busca.trim().toLowerCase()
  return atividades.filter(
    (atividade) =>
      (!termo ||
        atividade.nome.toLowerCase().includes(termo) ||
        atividade.responsavel.toLowerCase().includes(termo)) &&
      (iniciativaId === "todas" || atividade.iniciativaId === iniciativaId) &&
      (situacao === "todas" || atividade.situacao === situacao),
  )
}

export interface PermissoesAtividades {
  registrarAtividade: boolean
}

// Documento da Sprint 1, seção 3.1: o educador registra atividades, encontros
// e frequência; a coordenação tem acesso a atividades e frequência.
export function permissoesAtividades(
  perfil: Perfil | undefined,
): PermissoesAtividades {
  return {
    registrarAtividade: perfil === "coordenador" || perfil === "educador",
  }
}

export function novoIdAtividade(): string {
  return `atv-${Math.random().toString(36).slice(2, 8)}`
}

export function atividadeVazia(responsavel = ""): Atividade {
  return {
    id: "",
    nome: "",
    iniciativaId: "",
    responsavel,
    situacao: "Ativa",
    descricao: "",
  }
}

// RF17: toda atividade precisa de nome, iniciativa e responsável.
export function validarAtividade(atividade: Atividade): string | null {
  if (!atividade.nome.trim()) return "Informe o nome da atividade."
  if (!atividade.iniciativaId)
    return "Selecione o projeto, serviço ou programa da atividade."
  if (!atividade.responsavel.trim()) return "Informe o responsável."
  return null
}

// Cria quando o id ainda não existe na lista e atualiza quando já existe.
// Lança erro com a mensagem de validação, sem alterar a lista.
export function salvarAtividadeEmMemoria(
  lista: Atividade[],
  registro: Atividade,
): Atividade[] {
  const erro = validarAtividade(registro)
  if (erro) throw new Error(erro)

  const limpo: Atividade = {
    ...registro,
    nome: registro.nome.trim(),
    responsavel: registro.responsavel.trim(),
    descricao: registro.descricao.trim(),
  }
  return lista.some((atividade) => atividade.id === limpo.id)
    ? lista.map((atividade) => (atividade.id === limpo.id ? limpo : atividade))
    : [...lista, limpo]
}
