import { Module } from '@nestjs/common';
import { AuditoriasModule } from '../../shared/auditorias/auditorias.module';
import { FontesDeRecursoController } from './fontes-de-recurso.controller';
import { FontesDeRecursoService } from './fontes-de-recurso.service';

@Module({
  imports: [AuditoriasModule],
  controllers: [FontesDeRecursoController],
  providers: [FontesDeRecursoService],
})
export class FontesDeRecursoModule {}
