import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEncaminhamentoDto {
  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsInt()
  educandoId!: number;

  @ApiPropertyOptional({ example: 27 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  evolucaoId?: number;

  // Conteúdo do encaminhamento realizado. Opcional porque os registros
  // anteriores à US02 não têm descrição.
  @ApiPropertyOptional({
    maxLength: 2000,
    example: 'Encaminhado para atendimento especializado.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;

  // Sprint 3 (RF08): serviço da rede para onde o educando foi encaminhado.
  @ApiPropertyOptional({ maxLength: 200, example: 'CAPS Infantil' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  destino?: string;

  @ApiPropertyOptional({ example: '2026-09-22T15:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataEncaminhamento?: Date;

  @ApiPropertyOptional({ example: 'pendente', default: 'em andamento' })
  @IsOptional()
  @IsString()
  situacaoAtual?: string;
}