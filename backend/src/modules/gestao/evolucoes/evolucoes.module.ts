import { Module } from '@nestjs/common';
import { EvolucoesController } from './evolucoes.controller';
import { EvolucoesService } from './evolucoes.service';

@Module({
  controllers: [EvolucoesController],
  providers: [EvolucoesService],
})
export class EvolucoesModule {}
