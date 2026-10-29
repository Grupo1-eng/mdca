import { Module } from '@nestjs/common';
import { ContasFinanceirasController } from './contas-financeiras.controller';
import { ContasFinanceirasService } from './contas-financeiras.service';

@Module({
  controllers: [ContasFinanceirasController],
  providers: [ContasFinanceirasService],
})
export class ContasFinanceirasModule {}
