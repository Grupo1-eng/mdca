import { PartialType } from '@nestjs/mapped-types';
import { CreateOrcamentoDto } from './create-orcamento.dto';

export class UpdateOrcamentoDto extends PartialType(CreateOrcamentoDto) {}
