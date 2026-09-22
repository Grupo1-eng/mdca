import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './modules/shared/shared.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';

@Module({
  imports: [PrismaModule, SharedModule, FinanceiroModule],
})
export class AppModule {}
