import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEncaminhamentoDto {
  @Type(() => Number)
  @IsInt()
  educandoId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  evolucaoId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataEncaminhamento?: Date;

  @IsOptional()
  @IsString()
  situacaoAtual?: string;
}
