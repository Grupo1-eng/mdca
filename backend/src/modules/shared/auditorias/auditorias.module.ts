import { Module } from '@nestjs/common';
import { AuditoriasController } from './auditorias.controller';
import { AuditoriasService } from './auditorias.service';

@Module({
  controllers: [AuditoriasController],
  providers: [AuditoriasService],
})
export class AuditoriasModule {}
