import { Module } from '@nestjs/common';
import { AuditoriasModule } from '../../shared/auditorias/auditorias.module';
import { ContasFinanceirasController } from './contas-financeiras.controller';
import { ContasFinanceirasService } from './contas-financeiras.service';

@Module({
  imports: [AuditoriasModule],
  controllers: [ContasFinanceirasController],
  providers: [ContasFinanceirasService],
})
export class ContasFinanceirasModule {}
