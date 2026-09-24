import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAcompanhamentoEncaminhamentoDto {
  @Type(() => Number)
  @IsInt()
  encaminhamentoId: number;

  @IsString()
  @IsNotEmpty()
  situacao: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data?: Date;

  @IsOptional()
  @IsString()
  observacao?: string;
}
