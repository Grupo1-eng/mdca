import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { ProjetosService } from './projetos.service';

// Só consulta: todo usuário logado lê os projetos. O cadastro e a edição são
// feitos pela coordenação no módulo Gestão (POST/PUT /api/iniciativas), como
// combinado entre os grupos em 2026-11-17. Não há exclusão.
@ApiTags('Projetos')
@ApiBearerAuth('access-token')
@Controller('api/projetos')
@UseGuards(PerfisGuard)
export class ProjetosController {
  constructor(private readonly service: ProjetosService) {}

  @Get()
  listarTodos() {
    return this.service.listarTodos();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }
}
