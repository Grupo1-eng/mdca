import { Module } from '@nestjs/common';
import { ResponsaveisFamiliaresController } from './responsaveis-familiares.controller';
import { ResponsaveisFamiliaresService } from './responsaveis-familiares.service';

@Module({
  controllers: [ResponsaveisFamiliaresController],
  providers: [ResponsaveisFamiliaresService],
})
export class ResponsaveisFamiliaresModule {}
