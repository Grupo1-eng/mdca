import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    console.log('[Prisma] conectando ao banco...');
    await this.$connect();
    console.log('[Prisma] conexão estabelecida.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
