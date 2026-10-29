import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { EducandosService } from './educandos.service';
import { CreateEducandoDto } from './dto/create-educando.dto';
import { UpdateEducandoDto } from './dto/update-educando.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';

import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

import {
  PERFIS,
  PERFIS_TECNICOS,
} from '../../auth/perfis.constants';

@Controller('api/educandos')
@UseGuards(JwtAuthGuard, PerfisGuard)
export class EducandosController {
  constructor(private readonly service: EducandosService) {}

  @Get()
  listarTodos(
    @UsuarioAtual() usuario: UsuarioAutenticado,

    @Query(
      'apenasAtivos',
      new ParseBoolPipe({ optional: true }),
    )
    apenasAtivos?: boolean,

    @Query('nome') nome?: string,
  ) {
    return this.service.listarTodos(
      usuario.organizacaoId,
      apenasAtivos ?? true,
      nome,
    );
  }

  @Get(':id')
  @Perfis(...PERFIS_TECNICOS)
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.buscarPorId(
      id,
      usuario.organizacaoId,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Perfis(...PERFIS_TECNICOS)
  criar(
    @Body() dados: CreateEducandoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(
      dados,
      usuario.organizacaoId,
    );
  }

  @Put(':id')
  @Perfis(...PERFIS_TECNICOS)
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateEducandoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(
      id,
      dados,
      usuario.organizacaoId,
    );
  }

  @Patch(':id/inativar')
  @Perfis(PERFIS.COORDENACAO)
  inativar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.inativar(
      id,
      usuario.organizacaoId,
    );
  }

  @Patch(':id/reativar')
  @Perfis(PERFIS.COORDENACAO)
  reativar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.reativar(
      id,
      usuario.organizacaoId,
    );
  }
}