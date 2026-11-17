import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { SITUACOES_ATIVIDADE, SituacaoAtividade } from '../regras-atividades';

export class CreateAtividadeDto {
  // Id da iniciativa (tabela `projeto`).
  @Type(() => Number)
  @IsInt()
  projetoId!: number;

  // Usuário ativo da organização, com perfil de coordenação ou educador.
  @Type(() => Number)
  @IsInt()
  responsavelId!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string | null;

  @IsOptional()
  @IsIn(SITUACOES_ATIVIDADE)
  situacao?: SituacaoAtividade;
}
