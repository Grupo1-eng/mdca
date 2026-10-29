import { Module } from '@nestjs/common';
import { AuditoriasModule } from '../auditorias/auditorias.module';
import { ProjetosController } from './projetos.controller';
import { ProjetosService } from './projetos.service';

@Module({
  imports: [AuditoriasModule],
  controllers: [ProjetosController],
  providers: [ProjetosService],
})
export class ProjetosModule {}
