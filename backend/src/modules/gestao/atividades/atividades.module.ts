import { Module } from '@nestjs/common';

import { AtividadesController } from './atividades.controller';
import { AtividadesService } from './atividades.service';

@Module({
  controllers: [AtividadesController],
  providers: [AtividadesService],
})
export class AtividadesModule {}
