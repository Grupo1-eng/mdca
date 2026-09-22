import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

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

  @Type(() => Number)
  @IsInt()
  usuarioId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contatoId?: number;

  @Type(() => Number)
  @IsNumber()
  valor: number;

  @IsString()
  @IsNotEmpty()
  tipo: string;

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
  @IsString()
  situacao?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  criadoEm?: Date;
}
