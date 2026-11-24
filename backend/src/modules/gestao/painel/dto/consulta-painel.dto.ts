import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';

const DATA = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/painel?inicio=AAAA-MM-DD&fim=AAAA-MM-DD[&iniciativaId=N]
export class ConsultaPainelDto {
  @Matches(DATA, { message: 'Informe a data inicial no formato AAAA-MM-DD.' })
  inicio: string;

  @Matches(DATA, { message: 'Informe a data final no formato AAAA-MM-DD.' })
  fim: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A iniciativa informada é inválida.' })
  @Min(1, { message: 'A iniciativa informada é inválida.' })
  iniciativaId?: number;
}
