import { Module } from '@nestjs/common';
import { AuditoriasModule } from '../../shared/auditorias/auditorias.module';
import { CategoriasFinanceirasController } from './categorias-financeiras.controller';
import { CategoriasFinanceirasService } from './categorias-financeiras.service';

@Module({
  imports: [AuditoriasModule],
  controllers: [CategoriasFinanceirasController],
  providers: [CategoriasFinanceirasService],
})
export class CategoriasFinanceirasModule {}
