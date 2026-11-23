import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { SEM_PROJETO } from './resumo-semanal-query.dto';

export const TIPOS_DO_EXTRATO = ['entrada', 'saida'] as const;

export class ExtratoQueryDto {
  @ApiPropertyOptional({
    example: '2026-11-01',
    description: 'Primeiro dia do período, no formato AAAA-MM-DD.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'de deve estar no formato AAAA-MM-DD (ex.: 2026-11-01)',
  })
  de?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Último dia do período, no formato AAAA-MM-DD.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'ate deve estar no formato AAAA-MM-DD (ex.: 2026-11-30)',
  })
  ate?: string;

  @ApiPropertyOptional({
    example: '12',
    description: `Só os lançamentos deste projeto. "${SEM_PROJETO}" traz os lançamentos sem projeto.`,
  })
  @IsOptional()
  @Matches(new RegExp(`^([1-9]\\d*|${SEM_PROJETO})$`), {
    message: `projetoId deve ser o id de um projeto ou "${SEM_PROJETO}"`,
  })
  projetoId?: string;

  @ApiPropertyOptional({
    example: '3',
    description: 'Só os lançamentos desta categoria. Uma categoria principal inclui as subcategorias.',
  })
  @IsOptional()
  @Matches(/^[1-9]\d*$/, { message: 'categoriaId deve ser o id de uma categoria' })
  categoriaId?: string;

  @ApiPropertyOptional({ enum: TIPOS_DO_EXTRATO, description: 'Só entradas ou só saídas.' })
  @IsOptional()
  @IsIn(TIPOS_DO_EXTRATO, { message: 'tipo deve ser entrada ou saida' })
  tipo?: (typeof TIPOS_DO_EXTRATO)[number];

  @ApiPropertyOptional({
    example: 'oficina',
    description: 'Texto procurado na descrição do lançamento ou no nome do projeto.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  busca?: string;
}
