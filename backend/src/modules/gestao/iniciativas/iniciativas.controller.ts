import { Controller, Get, UseGuards } from '@nestjs/common';

import { Perfis } from '../../auth/decorators/perfis.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { PERFIS_GESTAO } from '../perfis-gestao';
import { IniciativasService } from './iniciativas.service';

@Controller('api/iniciativas')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_GESTAO)
export class IniciativasController {
  constructor(private readonly service: IniciativasService) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listar(usuario.organizacaoId);
  }
}
