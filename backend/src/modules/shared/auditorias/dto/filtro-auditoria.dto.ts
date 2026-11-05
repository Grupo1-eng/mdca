import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginacaoAuditoriaDto {
  // id do último registro da página anterior (proximoCursor da resposta).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}

export class FiltroAuditoriaDto extends PaginacaoAuditoriaDto {
  @IsOptional()
  @IsString()
  acao?: string;

  @IsOptional()
  @IsString()
  recursoTipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuarioId?: number;

  // Datas no formato AAAA-MM-DD (horário de Brasília) ou ISO completo.
  // "ate" só com a data inclui o dia inteiro.
  @IsOptional()
  @IsISO8601({ strict: true })
  de?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  ate?: string;
}
