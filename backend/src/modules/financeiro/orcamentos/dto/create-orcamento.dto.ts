import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Dinheiro } from '../../../../common/transformers/dinheiro';

export class CreateOrcamentoDto {
  @Type(() => Number)
  @IsInt()
  projetoId: number;

  @Type(() => Number)
  @IsInt()
  categoriaId: number;

  @IsString()
  @IsNotEmpty()
  periodoReferencia: string;

  @Dinheiro()
  valorPrevisto: string;
}
