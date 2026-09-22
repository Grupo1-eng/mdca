import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditoriaDto } from './create-auditoria.dto';

export class UpdateAuditoriaDto extends PartialType(CreateAuditoriaDto) {}
