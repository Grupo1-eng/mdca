import { PartialType } from '@nestjs/mapped-types';
import { CreateEducandoDto } from './create-educando.dto';

export class UpdateEducandoDto extends PartialType(CreateEducandoDto) {}
