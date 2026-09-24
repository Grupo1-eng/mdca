import { PartialType } from '@nestjs/mapped-types';
import { CreateEvolucaoDto } from './create-evolucao.dto';

export class UpdateEvolucaoDto extends PartialType(
  CreateEvolucaoDto,
) {}
