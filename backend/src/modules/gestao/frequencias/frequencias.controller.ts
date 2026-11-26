import { Body, Controller, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';

import { Perfis } from '../../auth/decorators/perfis.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import {
  PERFIS_EXPORTAM_RELATORIOS,
  PERFIS_GESTAO,
  PERFIS_REGISTRO_ATIVIDADES,
} from '../perfis-gestao';
import { ConsultaListaPresencaDto } from './dto/consulta-lista-presenca.dto';
import { RegistrarChamadaDto } from './dto/registrar-chamada.dto';
import { FrequenciasService } from './frequencias.service';

// Todos os perfis da Gestão consultam; coordenação e educador fazem a chamada.
@Controller('api/frequencias')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_REGISTRO_ATIVIDADES)
export class FrequenciasController {
  constructor(private readonly service: FrequenciasService) {}

  @Get('encontro/:id')
  @Perfis(...PERFIS_GESTAO)
  chamada(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.chamada(id, usuario.organizacaoId);
  }

  @Put('encontro/:id')
  registrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: RegistrarChamadaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.registrar(id, dados, usuario.organizacaoId);
  }

  // Lista de presença da atividade no período (prestação de contas): só quem
  // exporta relatórios (coordenação e administrativo).
  @Get('atividade/:id')
  @Perfis(...PERFIS_EXPORTAM_RELATORIOS)
  listaDePresenca(
    @Param('id', ParseIntPipe) id: number,
    @Query() filtros: ConsultaListaPresencaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.listaDePresenca(id, filtros.inicio, filtros.fim, usuario.organizacaoId);
  }

  @Get('educando/:id')
  @Perfis(...PERFIS_GESTAO)
  historico(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.historicoDoEducando(id, usuario.organizacaoId);
  }
}
