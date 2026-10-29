import { Module } from '@nestjs/common';
import { AuditoriasModule } from '../../shared/auditorias/auditorias.module';
import { OrcamentosController } from './orcamentos.controller';
import { OrcamentosService } from './orcamentos.service';

@Module({
  imports: [AuditoriasModule],
  controllers: [OrcamentosController],
  providers: [OrcamentosService],
})
export class OrcamentosModule {}
