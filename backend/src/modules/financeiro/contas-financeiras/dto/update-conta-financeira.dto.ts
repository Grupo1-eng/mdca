import { PartialType } from '@nestjs/mapped-types';
import { CreateContaFinanceiraDto } from './create-conta-financeira.dto';

export class UpdateContaFinanceiraDto extends PartialType(CreateContaFinanceiraDto) {}
