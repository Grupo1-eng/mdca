import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SharedModule } from './modules/shared/shared.module';
import { GestaoModule } from './modules/gestao/gestao.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { ContextoRequisicaoMiddleware } from './common/contexto/contexto-requisicao';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SharedModule,
    GestaoModule,
    FinanceiroModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextoRequisicaoMiddleware).forRoutes('*');
  }
}
