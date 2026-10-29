import { PartialType } from '@nestjs/swagger';
import { CreateContaFinanceiraDto } from './create-conta-financeira.dto';

export class UpdateContaFinanceiraDto extends PartialType(CreateContaFinanceiraDto) {}
