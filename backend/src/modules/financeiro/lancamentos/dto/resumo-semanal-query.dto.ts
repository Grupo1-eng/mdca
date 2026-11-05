import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

/** Valor de `projetoId` que pede só os lançamentos sem projeto vinculado. */
export const SEM_PROJETO = 'nenhum';

export class ResumoSemanalQueryDto {
  @ApiProperty({
    example: '2026-11',
    description: 'Mês analisado, no formato AAAA-MM.',
  })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'mes deve estar no formato AAAA-MM (ex.: 2026-11)',
  })
  mes: string;

  @ApiPropertyOptional({
    example: '12',
    description: `Só os lançamentos deste projeto. "${SEM_PROJETO}" traz os lançamentos sem projeto; sem o parâmetro, traz todos.`,
  })
  @IsOptional()
  @Matches(new RegExp(`^([1-9]\\d*|${SEM_PROJETO})$`), {
    message: `projetoId deve ser o id de um projeto ou "${SEM_PROJETO}"`,
  })
  projetoId?: string;
}
