import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContaFinanceiraDto {
  @Type(() => Number)
  @IsInt()
  organizacaoId: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  banco?: string;

  @IsOptional()
  @IsString()
  agencia?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  saldoInicial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  saldoAtual?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativa?: boolean;
}
