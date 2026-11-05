import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class ResumoSemanalQueryDto {
  @ApiProperty({
    example: '2026-11',
    description: 'Mês analisado, no formato AAAA-MM.',
  })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'mes deve estar no formato AAAA-MM (ex.: 2026-11)',
  })
  mes: string;
}
