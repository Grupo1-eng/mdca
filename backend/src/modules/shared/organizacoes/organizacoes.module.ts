import { Module } from '@nestjs/common';
import { OrganizacoesController } from './organizacoes.controller';
import { OrganizacoesService } from './organizacoes.service';

@Module({
  controllers: [OrganizacoesController],
  providers: [OrganizacoesService],
})
export class OrganizacoesModule {}
