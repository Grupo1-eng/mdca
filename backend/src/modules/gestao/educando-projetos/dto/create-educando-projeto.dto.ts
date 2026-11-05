import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional } from 'class-validator';

export class CreateEducandoProjetoDto {
  @Type(() => Number)
  @IsInt()
  educandoId!: number;

  // Id da iniciativa (tabela `projeto`).
  @Type(() => Number)
  @IsInt()
  projetoId!: number;

  // Sem data, o banco usa o momento do cadastro.
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataIngresso?: Date;
}
