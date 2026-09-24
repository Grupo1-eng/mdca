import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizacaoDto } from './create-organizacao.dto';

export class UpdateOrganizacaoDto extends PartialType(CreateOrganizacaoDto) {}
