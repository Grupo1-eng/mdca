import type { TipoProjetoApi } from "../api/projetos"
import type { IniciativaTela } from "../api/projetosMapper"

export interface FiltroIniciativas {
  busca: string
  tipo: "todos" | TipoProjetoApi
  status: string
}

export function filtrarIniciativas(
  iniciativas: IniciativaTela[],
  filtro: FiltroIniciativas,
): IniciativaTela[] {
  const termo = filtro.busca.trim().toLocaleLowerCase("pt-BR")
  return iniciativas.filter((item) => {
    const texto = `${item.nome} ${item.descricao}`.toLocaleLowerCase("pt-BR")
    return (
      (termo === "" || texto.includes(termo)) &&
      (filtro.tipo === "todos" || item.tipo === filtro.tipo) &&
      (filtro.status === "todos" || item.status === filtro.status)
    )
  })
}

export function iniciativaVazia(): IniciativaTela {
  return {
    id: "",
    nome: "",
    descricao: "",
    tipo: "PROJETO",
    status: "Planejamento",
    orcamento: "",
    dataInicio: "",
    dataFim: "",
  }
}
