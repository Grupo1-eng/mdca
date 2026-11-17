import { Module } from '@nestjs/common';

import { FrequenciasController } from './frequencias.controller';
import { FrequenciasService } from './frequencias.service';

@Module({
  controllers: [FrequenciasController],
  providers: [FrequenciasService],
})
export class FrequenciasModule {}
