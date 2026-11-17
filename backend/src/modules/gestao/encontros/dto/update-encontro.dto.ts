import { OmitType, PartialType } from '@nestjs/mapped-types';

import { CreateEncontroDto } from './create-encontro.dto';

// O encontro não muda de atividade.
export class UpdateEncontroDto extends PartialType(
  OmitType(CreateEncontroDto, ['atividadeId'] as const),
) {}
