import { Module } from '@nestjs/common';
import { ContatosController } from './contatos.controller';
import { ContatosService } from './contatos.service';

@Module({
  controllers: [ContatosController],
  providers: [ContatosService],
})
export class ContatosModule {}
