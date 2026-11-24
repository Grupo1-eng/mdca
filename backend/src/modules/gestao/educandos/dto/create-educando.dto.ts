import {
  IsDate,
  IsInt,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEducandoDto {
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

  // Autorização de uso de imagem e voz (questionário da MDCA, pergunta 24).
  // null = não informado.
  @IsOptional()
  @IsBoolean({ message: 'A autorização de uso de imagem deve ser sim ou não.' })
  autorizacaoImagem?: boolean | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Informe uma data de assinatura válida.' })
  autorizacaoImagemData?: Date | null;
}