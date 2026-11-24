import { Module } from '@nestjs/common';

import { PainelController } from './painel.controller';
import { PainelService } from './painel.service';

@Module({
  controllers: [PainelController],
  providers: [PainelService],
})
export class PainelModule {}
