import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContatoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  papel?: string;

  @IsOptional()
  @IsString()
  cpfCnpj?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
