import { Module } from '@nestjs/common';
import { EducandosController } from './educandos.controller';
import { EducandosService } from './educandos.service';

@Module({
  controllers: [EducandosController],
  providers: [EducandosService],
})
export class EducandosModule {}
