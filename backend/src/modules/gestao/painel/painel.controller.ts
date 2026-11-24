import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Perfis } from '../../auth/decorators/perfis.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { PERFIS_GESTAO } from '../perfis-gestao';
import { ConsultaPainelDto } from './dto/consulta-painel.dto';
import { PainelService } from './painel.service';

// Painel de indicadores (US05): só números agregados, sem dados pessoais.
// Todos os perfis da Gestão consultam; o orçamento vai só para a coordenação.
@Controller('api/painel')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_GESTAO)
export class PainelController {
  constructor(private readonly service: PainelService) {}

  @Get()
  consultar(
    @Query() filtros: ConsultaPainelDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.consultar(filtros, usuario.organizacaoId, usuario.perfil);
  }
}
