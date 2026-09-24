import { PartialType } from '@nestjs/mapped-types';
import { CreateLancamentoDto } from './create-lancamento.dto';

export class UpdateLancamentoDto extends PartialType(CreateLancamentoDto) {}
