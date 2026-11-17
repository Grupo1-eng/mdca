import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Perfis } from '../../auth/decorators/perfis.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { PERFIS_GESTAO, PERFIS_VINCULO_INICIATIVA } from '../perfis-gestao';
import { CreateEducandoProjetoDto } from './dto/create-educando-projeto.dto';
import { UpdateEducandoProjetoDto } from './dto/update-educando-projeto.dto';
import { EducandoProjetosService } from './educando-projetos.service';

// Sem DELETE: o vínculo é encerrado e fica no histórico.
@Controller('api/educando-projetos')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_VINCULO_INICIATIVA)
export class EducandoProjetosController {
  constructor(private readonly service: EducandoProjetosService) {}

  @Get()
  @Perfis(...PERFIS_GESTAO)
  listarPorEducando(
    @Query('educandoId', ParseIntPipe) educandoId: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.listarPorEducando(educandoId, usuario.organizacaoId);
  }

  @Get(':id')
  @Perfis(...PERFIS_GESTAO)
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.buscarPorId(id, usuario.organizacaoId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Body() dados: CreateEducandoProjetoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(dados, usuario.organizacaoId);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateEducandoProjetoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dados, usuario.organizacaoId);
  }

  @Patch(':id/encerrar')
  encerrar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.encerrar(id, usuario.organizacaoId);
  }
}
