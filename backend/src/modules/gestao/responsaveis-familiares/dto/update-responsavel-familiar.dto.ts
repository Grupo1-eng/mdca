import { PartialType } from '@nestjs/mapped-types';
import { CreateResponsavelFamiliarDto } from './create-responsavel-familiar.dto';

export class UpdateResponsavelFamiliarDto extends PartialType(
  CreateResponsavelFamiliarDto,
) {}
