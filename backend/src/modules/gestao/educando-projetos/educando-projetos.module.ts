import { Module } from '@nestjs/common';

import { EducandoProjetosController } from './educando-projetos.controller';
import { EducandoProjetosService } from './educando-projetos.service';

@Module({
  controllers: [EducandoProjetosController],
  providers: [EducandoProjetosService],
})
export class EducandoProjetosModule {}
