import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Dinheiro } from '../../../../common/transformers/dinheiro';

// organizacaoId vem do token do usuário.
export class CreateContaFinanceiraDto {
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
  @Dinheiro({ permitirNegativo: true })
  saldoInicial?: string;

  @IsOptional()
  @Dinheiro({ permitirNegativo: true })
  saldoAtual?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativa?: boolean;
}
