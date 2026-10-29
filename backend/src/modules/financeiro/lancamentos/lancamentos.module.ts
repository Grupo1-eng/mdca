import { Module } from '@nestjs/common';
import { AuditoriasModule } from '../../shared/auditorias/auditorias.module';
import { LancamentosController } from './lancamentos.controller';
import { LancamentosService } from './lancamentos.service';

@Module({
  imports: [AuditoriasModule],
  controllers: [LancamentosController],
  providers: [LancamentosService],
})
export class LancamentosModule {}
