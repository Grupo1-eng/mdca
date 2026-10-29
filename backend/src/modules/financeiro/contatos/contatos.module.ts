import { Module } from '@nestjs/common';
import { AuditoriasModule } from '../../shared/auditorias/auditorias.module';
import { ContatosController } from './contatos.controller';
import { ContatosService } from './contatos.service';

@Module({
  imports: [AuditoriasModule],
  controllers: [ContatosController],
  providers: [ContatosService],
})
export class ContatosModule {}
