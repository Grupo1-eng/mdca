import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvolucaoDto {
  @Type(() => Number)
  @IsInt()
  educandoId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projetoId?: number;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;

  @IsOptional()
  @IsString()
  situacao?: string;

  // Sprint 3 (Anexo A.3).
  @IsOptional()
  @IsString()
  intervencaoUsuario?: string;

  @IsOptional()
  @IsString()
  intervencaoFamilia?: string;

  @IsOptional()
  @IsBoolean()
  sigiloso?: boolean;
}