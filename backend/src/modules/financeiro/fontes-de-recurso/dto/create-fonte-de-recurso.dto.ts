import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFonteDeRecursoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  origem?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativa?: boolean;
}
