// Tipos do domínio financeiro. Usados pela camada de API (src/api/) e pelos
// componentes — uma mudança no contrato do backend começa aqui.

export type TipoLancamento = "entrada" | "saida";
export type SituacaoLancamento = "Recebido" | "Pago" | "Previsto";

export interface Lancamento {
  id: string;
  data: string; // ISO date (YYYY-MM-DD)
  descricao: string;
  projeto: string;
  conta: string;
  valor: number; // positivo = entrada, negativo = saída
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
}

export type NovoLancamento = Omit<Lancamento, "id">;

export type StatusProjeto = "Em andamento" | "Planejamento" | "Concluído";

export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  status: StatusProjeto;
  inicio: string; // ISO date
  fim: string; // ISO date
  cor: string;
  orcamento: number;
  realizado: number;
  tags: string[];
}

export type NovoProjeto = Omit<Projeto, "id" | "realizado">;

export interface Conta {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: string;
  saldo: number;
  status: "Ativa" | "Inativa";
}

export type NovaConta = Omit<Conta, "id">;

export interface Contato {
  id: string;
  nome: string;
  tipo: string;
  cnpj: string;
  email: string;
  telefone: string;
  status: "Ativo" | "Inativo";
  endereco?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  responsavel?: string;
}

export type NovoContato = Omit<Contato, "id">;

export interface Fonte {
  id: string;
  nome: string;
  origem: string;
  tipo: string;
  vigencia: string;
  valor: number;
  status: "Vigente" | "Aguardando" | "Encerrado";
  numero?: string;
  objeto?: string;
}

export type NovaFonte = Omit<Fonte, "id">;

export interface Categoria {
  id: string;
  codigo: string;
  nome: string;
  tipo: "Receita" | "Despesa";
  subcategorias: string[];
}

export type NovaCategoria = Omit<Categoria, "id">;

export interface Anexo {
  id: string;
  lancamentoId: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  dataUpload: string; // ISO datetime
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  organizacao?: string;
  cargo?: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  organizacao: string;
  cargo: string;
  senha: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Relatórios: execução orçamentária por projeto/categoria e balancete por
// fonte cruzam dados de projetos, categorias e fontes que os lançamentos não
// referenciam diretamente hoje — por isso ficam como endpoints de relatório
// dedicados (agregados no backend) em vez de recalculados no cliente.

export interface CategoriaExecucao {
  nome: string;
  orcado: number;
  realizado: number;
}

export interface ExecucaoProjeto {
  projeto: string;
  fonte: string;
  orcado: number;
  realizado: number;
  categorias: CategoriaExecucao[];
}

export interface BalanceteFonte {
  fonte: string;
  tipo: string;
  entradas: number;
  saidas: number;
  saldo: number;
}
