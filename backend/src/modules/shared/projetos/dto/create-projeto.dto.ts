import { IsDate, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export const TIPOS_PROJETO = ['PROJETO', 'SERVICO', 'PROGRAMA'] as const;
export type TipoProjeto = (typeof TIPOS_PROJETO)[number];

export class CreateProjetoDto {
  @Type(() => Number)
  @IsInt()
  organizacaoId: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsIn(TIPOS_PROJETO)
  tipo: TipoProjeto;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  orcamentoTotal?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;
}
