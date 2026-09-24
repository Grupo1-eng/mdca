import { Module } from '@nestjs/common';
import { EncaminhamentosController } from './encaminhamentos.controller';
import { EncaminhamentosService } from './encaminhamentos.service';

@Module({
  controllers: [EncaminhamentosController],
  providers: [EncaminhamentosService],
})
export class EncaminhamentosModule {}
