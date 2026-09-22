import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoriaFinanceiraDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoriaPaiId?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativa?: boolean;
}
