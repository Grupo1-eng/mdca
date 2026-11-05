import {
  IsDate,
  IsInt,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEducandoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

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

  // Sprint 3 (RF01/RF02, Anexo A.1/A.2).
  @IsOptional()
  @IsString()
  genero?: string;

  @IsOptional()
  @IsString()
  serie?: string;

  @IsOptional()
  @IsString()
  origemEncaminhamento?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  motivosIngresso?: string[];
}