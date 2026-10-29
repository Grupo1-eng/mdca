import { Module } from '@nestjs/common';
import { AuditoriasController } from './auditorias.controller';
import { AuditoriasService } from './auditorias.service';
import { RegistroAuditoriaService } from './registro-auditoria.service';

@Module({
  controllers: [AuditoriasController],
  providers: [AuditoriasService, RegistroAuditoriaService],
  exports: [RegistroAuditoriaService],
})
export class AuditoriasModule {}
