import { PartialType } from '@nestjs/mapped-types';
import { CreateFonteDeRecursoDto } from './create-fonte-de-recurso.dto';

export class UpdateFonteDeRecursoDto extends PartialType(CreateFonteDeRecursoDto) {}
