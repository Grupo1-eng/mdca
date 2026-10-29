import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AuditoriasService } from './auditorias.service';

@Controller('api/auditorias')
export class AuditoriasController {
  constructor(private readonly service: AuditoriasService) {}

  @Get()
  listarTodas() {
    return this.service.listarTodas();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }
}
