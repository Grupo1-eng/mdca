import { Prisma } from '@prisma/client';

export type Alteracao =
  | { de?: string | number | boolean | null; para?: string | number | boolean | null }
  | { alterado: true };

export type Alteracoes = Record<string, Alteracao>;

// Nunca entram no log, nem como "alterado".
const OMITIDOS = new Set(['cpfCnpj', 'senhaHash']);
// O log registra que mudou, mas não o conteúdo.
const SO_INDICA_ALTERACAO = new Set(['telefone', 'observacoes']);
// Dados bancários: só os últimos caracteres ficam visíveis.
const ULTIMOS_CARACTERES: Record<string, number> = { agencia: 2, numero: 4 };
// Metadados que não são alteração feita pelo usuário (organizacaoId já é
// coluna do próprio registro de auditoria).
const IGNORADOS = new Set(['id', 'criadoEm', 'organizacaoId']);

type Valor = string | number | boolean | null;

function normalizar(valor: unknown): Valor | undefined {
  if (valor === null || valor === undefined) return null;
  if (Prisma.Decimal.isDecimal(valor)) return (valor as Prisma.Decimal).toString();
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
    return valor;
  }
  // Relações e objetos aninhados não fazem parte do diff do registro.
  return undefined;
}

function mascarar(campo: string, valor: Valor): Valor {
  const visiveis = ULTIMOS_CARACTERES[campo];
  if (visiveis === undefined || valor === null) return valor;
  const texto = String(valor);
  return texto.length <= visiveis ? '•'.repeat(texto.length) : `••${texto.slice(-visiveis)}`;
}

// Só os campos que mudaram. Na criação passe antes = null (só "para");
// na exclusão, depois = null (só "de"). Na atualização passe os registros
// completos lidos do banco, não o DTO: campo ausente conta como null.
export function diferencas(
  antes: Record<string, unknown> | null,
  depois: Record<string, unknown> | null,
): Alteracoes {
  const campos = new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})]);
  const resultado: Alteracoes = {};

  for (const campo of campos) {
    if (OMITIDOS.has(campo) || IGNORADOS.has(campo)) continue;

    const de = antes ? normalizar(antes[campo]) : undefined;
    const para = depois ? normalizar(depois[campo]) : undefined;
    if (de === undefined && para === undefined) continue;
    if (antes && depois && de === para) continue;
    // Criação ou exclusão: campos vazios não dizem nada.
    if ((!antes || !depois) && (antes ? de : para) === null) continue;

    if (SO_INDICA_ALTERACAO.has(campo)) {
      resultado[campo] = { alterado: true };
      continue;
    }

    const alteracao: Alteracao = {};
    if (antes) alteracao.de = mascarar(campo, de ?? null);
    if (depois) alteracao.para = mascarar(campo, para ?? null);
    resultado[campo] = alteracao;
  }

  return resultado;
}
