import { IsDate, IsIn, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { Dinheiro } from '../../../../common/transformers/dinheiro';

export const TIPOS_LANCAMENTO = ['entrada', 'saida'] as const;
// "pendente" é o valor padrão da coluna no banco.
export const SITUACOES_LANCAMENTO = ['pendente', 'pago', 'recebido'] as const;

// usuarioId e criadoEm são definidos pelo servidor (token e banco).
export class CreateLancamentoDto {
  @Type(() => Number)
  @IsInt()
  contaId: number;

  @Type(() => Number)
  @IsInt()
  categoriaId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projetoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contatoId?: number;

  @Dinheiro()
  // RF33: maior que zero. Basta ter um dígito diferente de zero ("0.01", "10").
  @Matches(/[1-9]/, { message: 'valor deve ser maior que zero' })
  valor: string;

  @IsIn(TIPOS_LANCAMENTO)
  tipo: (typeof TIPOS_LANCAMENTO)[number];

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataPagamento?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataCompetencia?: Date;

  @IsOptional()
  @IsIn(SITUACOES_LANCAMENTO)
  situacao?: (typeof SITUACOES_LANCAMENTO)[number];
}
