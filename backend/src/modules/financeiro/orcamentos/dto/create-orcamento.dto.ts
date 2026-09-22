import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

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

  @Type(() => Number)
  @IsNumber()
  valorPrevisto: number;
}
