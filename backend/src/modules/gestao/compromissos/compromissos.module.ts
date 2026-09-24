import { Module } from '@nestjs/common';
import { CompromissosController } from './compromissos.controller';
import { CompromissosService } from './compromissos.service';

@Module({
  controllers: [CompromissosController],
  providers: [CompromissosService],
})
export class CompromissosModule {}
