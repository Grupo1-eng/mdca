import { Module } from '@nestjs/common';

import { IniciativasController } from './iniciativas.controller';
import { IniciativasService } from './iniciativas.service';

@Module({
  controllers: [IniciativasController],
  providers: [IniciativasService],
})
export class IniciativasModule {}
