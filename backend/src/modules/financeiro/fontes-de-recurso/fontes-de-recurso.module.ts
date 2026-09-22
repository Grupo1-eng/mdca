import { Module } from '@nestjs/common';
import { FontesDeRecursoController } from './fontes-de-recurso.controller';
import { FontesDeRecursoService } from './fontes-de-recurso.service';

@Module({
  controllers: [FontesDeRecursoController],
  providers: [FontesDeRecursoService],
})
export class FontesDeRecursoModule {}
