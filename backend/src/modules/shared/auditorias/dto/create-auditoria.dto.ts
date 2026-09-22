import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuditoriaDto {
  @Type(() => Number)
  @IsInt()
  usuarioId: number;

  @IsString()
  @IsNotEmpty()
  recursoId: string;

  @IsString()
  @IsNotEmpty()
  recursoTipo: string;

  @IsString()
  @IsNotEmpty()
  acao: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataHora?: Date;
}
