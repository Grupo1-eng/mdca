import { Global, Module } from '@nestjs/common';
import { AuditoriasController } from './auditorias.controller';
import { AuditoriasService } from './auditorias.service';
import { RegistroAuditoriaService } from './registro-auditoria.service';

// Global: o PerfisGuard é instanciado em cada módulo que o usa e precisa do
// RegistroAuditoriaService para registrar acessos negados.
@Global()
@Module({
  controllers: [AuditoriasController],
  providers: [AuditoriasService, RegistroAuditoriaService],
  exports: [RegistroAuditoriaService],
})
export class AuditoriasModule {}
