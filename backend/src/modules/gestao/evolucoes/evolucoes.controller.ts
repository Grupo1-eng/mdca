import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { EvolucoesService } from './evolucoes.service';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_TECNICOS } from '../../auth/perfis.constants';

import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

@Controller('api/evolucoes')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_TECNICOS)
export class EvolucoesController {
  constructor(
    private readonly service: EvolucoesService,
  ) {}

  @Get()
  listarPorEducando(
    @Query('educandoId', ParseIntPipe)
    educandoId: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.listarPorEducando(
      educandoId,
      usuario,
    );
  }

  // Painel dos técnicos: últimos atendimentos da organização, sem o texto.
  // Antes de ':id', para "recentes" não ser lido como número.
  @Get('recentes')
  recentes(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listarRecentes(usuario.organizacaoId);
  }

  @Get(':id')
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.buscarPorId(
      id,
      usuario,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Body() dados: CreateEvolucaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(
      dados,
      usuario.id,
      usuario.organizacaoId,
    );
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateEvolucaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(
      id,
      dados,
      usuario,
    );
  }
}