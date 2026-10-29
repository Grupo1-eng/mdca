import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { EncaminhamentosService } from './encaminhamentos.service';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_TECNICOS } from '../../auth/perfis.constants';

import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

@Controller('api/encaminhamentos')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_TECNICOS)
export class EncaminhamentosController {
  constructor(
    private readonly service: EncaminhamentosService,
  ) {}

  @Get()
  listarPorEducando(
    @Query('educandoId', ParseIntPipe)
    educandoId: number,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.listarPorEducando(
      educandoId,
      usuario.organizacaoId,
    );
  }

  @Get(':id')
  buscar(
    @Param('id', ParseIntPipe)
    id: number,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.buscarPorId(
      id,
      usuario.organizacaoId,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Body()
    dados: CreateEncaminhamentoDto,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(
      dados,
      usuario.organizacaoId,
    );
  }
}