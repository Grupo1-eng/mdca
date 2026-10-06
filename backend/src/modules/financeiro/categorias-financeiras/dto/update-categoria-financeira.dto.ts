import { PartialType } from '@nestjs/swagger';
import { CreateCategoriaFinanceiraDto } from './create-categoria-financeira.dto';

export class UpdateCategoriaFinanceiraDto extends PartialType(CreateCategoriaFinanceiraDto) {}
