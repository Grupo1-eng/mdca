import { Module } from '@nestjs/common';
import { ProjetosController } from './projetos.controller';
import { ProjetosService } from './projetos.service';

@Module({
  controllers: [ProjetosController],
  providers: [ProjetosService],
})
export class ProjetosModule {}
