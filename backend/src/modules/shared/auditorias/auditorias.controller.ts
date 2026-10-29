import { Controller, Get, Header, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditoriasService } from './auditorias.service';
import { FiltroAuditoriaDto, PaginacaoAuditoriaDto } from './dto/filtro-auditoria.dto';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_AUDITORIA_FINANCEIRO } from '../../auth/perfis.constants';

@ApiTags('Auditoria')
@ApiBearerAuth('access-token')
@Controller('api/auditorias')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_AUDITORIA_FINANCEIRO)
export class AuditoriasController {
  constructor(private readonly service: AuditoriasService) {}

  @Get()
  listar(@Query() filtro: FiltroAuditoriaDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listar(usuario.organizacaoId, filtro);
  }

  // Declarada antes de ':id' para "exportar" não ser lido como id.
  @Get('exportar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="auditoria-financeiro.csv"')
  exportar(@Query() filtro: FiltroAuditoriaDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.exportarCsv(usuario.organizacaoId, filtro);
  }

  @Get(':recursoTipo/:recursoId')
  historico(
    @Param('recursoTipo') recursoTipo: string,
    @Param('recursoId') recursoId: string,
    @Query() paginacao: PaginacaoAuditoriaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.historico(usuario.organizacaoId, recursoTipo, recursoId, paginacao);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.buscarPorId(usuario.organizacaoId, id);
  }
}
