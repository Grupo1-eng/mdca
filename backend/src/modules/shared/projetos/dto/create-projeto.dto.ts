import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Dinheiro } from '../../../../common/transformers/dinheiro';

// organizacaoId vem do token do usuário.
export class CreateProjetoDto {
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
  @Dinheiro()
  orcamentoTotal?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;
}
