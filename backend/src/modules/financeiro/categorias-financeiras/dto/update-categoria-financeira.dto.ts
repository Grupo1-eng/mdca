import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaFinanceiraDto } from './create-categoria-financeira.dto';

export class UpdateCategoriaFinanceiraDto extends PartialType(CreateCategoriaFinanceiraDto) {}
