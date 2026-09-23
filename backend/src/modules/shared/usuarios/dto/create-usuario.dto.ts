import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUsuarioDto {
  @Type(() => Number)
  @IsInt()
  organizacaoId: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  senha: string;

  @IsString()
  @IsNotEmpty()
  perfil: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  criadoEm?: Date;
}
