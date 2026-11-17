import { Module } from '@nestjs/common';

import { EncontrosController } from './encontros.controller';
import { EncontrosService } from './encontros.service';

@Module({
  controllers: [EncontrosController],
  providers: [EncontrosService],
})
export class EncontrosModule {}
