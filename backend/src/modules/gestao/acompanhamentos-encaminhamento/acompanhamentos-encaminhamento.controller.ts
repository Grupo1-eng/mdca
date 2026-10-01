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

import { AcompanhamentosEncaminhamentoService } from './acompanhamentos-encaminhamento.service';
import { CreateAcompanhamentoEncaminhamentoDto } from './dto/create-acompanhamento-encaminhamento.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_TECNICOS } from '../../auth/perfis.constants';

import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

@Controller('api/acompanhamentos-encaminhamento')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_TECNICOS)
export class AcompanhamentosEncaminhamentoController {
  constructor(
    private readonly service: AcompanhamentosEncaminhamentoService,
  ) {}

  @Get()
  listarPorEncaminhamento(
    @Query('encaminhamentoId', ParseIntPipe)
    encaminhamentoId: number,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.listarPorEncaminhamento(
      encaminhamentoId,
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
    dados: CreateAcompanhamentoEncaminhamentoDto,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(
      dados,
      usuario.organizacaoId,
    );
  }
}