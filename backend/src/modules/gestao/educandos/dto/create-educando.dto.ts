import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEducandoDto {
  @Type(() => Number)
  @IsInt()
  organizacaoId: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsString()
  nis?: string;

  @IsOptional()
  @IsString()
  corAutodeclarada?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataNascimento?: Date;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  escola?: string;

  @IsOptional()
  @IsString()
  turno?: string;

  @IsOptional()
  @IsString()
  historicoRepetencia?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numerosPessoasFamilias?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rendaFamiliar?: number;

  @IsOptional()
  @IsString()
  beneficiosSociais?: string;

  @IsOptional()
  @IsString()
  tipoMoradia?: string;

  @IsOptional()
  @IsString()
  doencaCronica?: string;

  @IsOptional()
  @IsString()
  medicamentoContinuo?: string;

  @IsOptional()
  @IsString()
  observacaoSaude?: string;

  @IsOptional()
  @IsString()
  situacaoAtual?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tecnicoResponsavelId?: number;
}
