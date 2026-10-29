import { Module } from '@nestjs/common';
import { CategoriasFinanceirasController } from './categorias-financeiras.controller';
import { CategoriasFinanceirasService } from './categorias-financeiras.service';

@Module({
  controllers: [CategoriasFinanceirasController],
  providers: [CategoriasFinanceirasService],
})
export class CategoriasFinanceirasModule {}
