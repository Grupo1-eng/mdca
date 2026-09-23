import { Module } from '@nestjs/common';
import { AcompanhamentosEncaminhamentoController } from './acompanhamentos-encaminhamento.controller';
import { AcompanhamentosEncaminhamentoService } from './acompanhamentos-encaminhamento.service';

@Module({
  controllers: [
    AcompanhamentosEncaminhamentoController,
  ],
  providers: [
    AcompanhamentosEncaminhamentoService,
  ],
})
export class AcompanhamentosEncaminhamentoModule {}
