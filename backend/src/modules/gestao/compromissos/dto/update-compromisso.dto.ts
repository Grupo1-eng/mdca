import { PartialType } from '@nestjs/mapped-types';
import { CreateCompromissoDto } from './create-compromisso.dto';

export class UpdateCompromissoDto extends PartialType(
  CreateCompromissoDto,
) {}
