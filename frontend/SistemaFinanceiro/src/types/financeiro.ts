// Tipos do domínio financeiro, espelhando os models do Prisma e os DTOs do
// backend (backend/prisma/schema.prisma e backend/src/modules). Uma mudança no
// contrato do backend começa aqui.
//
// Leitura: valores Decimal chegam do backend como texto ("150.75") e são
// convertidos para number em src/api/normalizar.ts, só para exibir e somar.
// Escrita: valores em dinheiro são enviados como texto, para o backend gravar o
// valor exato sem passar por ponto flutuante.
// Datas chegam como ISO completo ("2026-09-24T00:00:00.000Z") e são enviadas
// como "YYYY-MM-DD".

export type TipoLancamento = "entrada" | "saida";
export type SituacaoLancamento = "pendente" | "pago" | "recebido";

export interface Lancamento {
  id: number;
  contaId: number;
  categoriaId: number;
  projetoId: number | null;
  usuarioId: number;
  contatoId: number | null;
  valor: number; // sempre positivo; a direção vem de `tipo`
  tipo: TipoLancamento;
  descricao: string | null;
  dataPagamento: string | null;
  dataCompetencia: string | null;
  situacao: SituacaoLancamento;
  criadoEm: string;
}

// usuarioId é definido pelo backend a partir do token.
export interface NovoLancamento {
  contaId: number;
  categoriaId: number;
  projetoId?: number;
  contatoId?: number;
  valor: string;
  tipo: TipoLancamento;
  descricao?: string;
  dataPagamento?: string;
  dataCompetencia?: string;
  situacao?: SituacaoLancamento;
}

// Obrigatório no backend a partir da branch feature/gestao-tipo-projeto.
export type TipoProjeto = "PROJETO" | "SERVICO" | "PROGRAMA";

export interface Projeto {
  id: number;
  organizacaoId: number;
  nome: string;
  descricao: string | null;
  status: string;
  orcamentoTotal: number | null;
  dataInicio: string | null;
  dataFim: string | null;
}

// organizacaoId é definido pelo backend a partir do token.
export interface NovoProjeto {
  nome: string;
  descricao?: string | null;
  tipo: TipoProjeto;
  status: string;
  orcamentoTotal?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}

export interface Conta {
  id: number;
  organizacaoId: number;
  nome: string;
  tipo: string | null;
  banco: string | null;
  agencia: string | null;
  numero: string | null;
  saldoInicial: number;
  saldoAtual: number;
  ativa: boolean;
}

// organizacaoId é definido pelo backend a partir do token.
export interface NovaConta {
  nome: string;
  tipo?: string | null;
  banco?: string | null;
  agencia?: string | null;
  numero?: string | null;
  saldoInicial?: string; // NOT NULL no banco: omitir em vez de enviar null
  saldoAtual?: string;
  ativa?: boolean;
}

export interface Contato {
  id: number;
  nome: string;
  tipo: string | null;
  papel: string | null;
  cpfCnpj: string | null;
  telefone: string | null;
  observacoes: string | null;
}

export interface NovoContato {
  nome: string;
  tipo?: string | null;
  papel?: string | null;
  cpfCnpj?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
}

export interface Fonte {
  id: number;
  nome: string;
  origem: string | null;
  ativa: boolean;
}

export interface NovaFonte {
  nome: string;
  origem?: string | null;
  ativa?: boolean;
}

export type TipoCategoria = "receita" | "despesa";

// Subcategorias são categorias com categoriaPaiId preenchido.
export interface Categoria {
  id: number;
  nome: string;
  tipo: string;
  categoriaPaiId: number | null;
  ativa: boolean;
}

export interface NovaCategoria {
  nome: string;
  tipo: string;
  categoriaPaiId?: number;
  ativa?: boolean;
}

export interface Orcamento {
  id: number;
  projetoId: number;
  categoriaId: number;
  periodoReferencia: string;
  valorPrevisto: number;
}

// Ainda sem endpoint no backend (ver src/api/anexos.ts).
export interface Anexo {
  id: string;
  lancamentoId: number;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  dataUpload: string;
}

// Valores gravados no banco (backend/src/modules/auth/perfis.constants.ts).
export type Perfil =
  | "coordenador"
  | "tecnico_servico_social"
  | "tecnico_psicologia"
  | "educador"
  | "administrativo";

export interface Usuario {
  id: number;
  organizacaoId: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: string;
}

// organizacaoId é definido pelo backend a partir do token da coordenação.
export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

export interface EdicaoUsuario {
  nome?: string;
  email?: string;
  senha?: string;
  perfil?: Perfil;
  ativo?: boolean;
}

// Mesmo formato em POST /api/auth/login (`usuario`) e GET /api/auth/me.
export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AuthResponse {
  accessToken: string;
  usuario: AuthUser;
}

export interface CategoriaExecucao {
  nome: string;
  orcado: number;
  realizado: number;
}

export interface ExecucaoProjeto {
  projetoId: number;
  projeto: string;
  orcado: number;
  realizado: number;
  categorias: CategoriaExecucao[];
}
