import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateResponsavelFamiliarDto {
  @Type(() => Number)
  @IsInt()
  educandoId!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'cpf deve ter 11 dígitos numéricos' })
  cpf?: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  profissao?: string;

  @IsString()
  @IsNotEmpty()
  vinculo!: string;

  @IsOptional()
  @IsString()
  tipoTrabalho?: string;

  @IsOptional()
  @IsString()
  localTrabalho?: string;

  @IsOptional()
  @IsString()
  escolaridade?: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}