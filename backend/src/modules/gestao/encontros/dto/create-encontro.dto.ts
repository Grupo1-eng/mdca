import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches } from 'class-validator';

import { DATA, HORARIO, SITUACOES_ENCONTRO, SituacaoEncontro } from '../../atividades/regras-atividades';

export class CreateEncontroDto {
  @Type(() => Number)
  @IsInt()
  atividadeId!: number;

  // Só o dia, no formato AAAA-MM-DD.
  @Matches(DATA, { message: 'A data deve estar no formato AAAA-MM-DD.' })
  data!: string;

  @IsOptional()
  @Matches(HORARIO, { message: 'O horário de início deve estar no formato HH:MM.' })
  horaInicio?: string | null;

  @IsOptional()
  @Matches(HORARIO, { message: 'O horário de término deve estar no formato HH:MM.' })
  horaFim?: string | null;

  @IsOptional()
  @IsString()
  local?: string | null;

  @IsOptional()
  @IsString()
  observacoes?: string | null;

  @IsOptional()
  @IsIn(SITUACOES_ENCONTRO)
  situacao?: SituacaoEncontro;
}
