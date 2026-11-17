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

import { Perfis } from '../../auth/decorators/perfis.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { PERFIS_GESTAO, PERFIS_REGISTRO_ATIVIDADES } from '../perfis-gestao';
import { CreateEncontroDto } from './dto/create-encontro.dto';
import { UpdateEncontroDto } from './dto/update-encontro.dto';
import { EncontrosService } from './encontros.service';

// Todos os perfis da Gestão consultam; coordenação e educador gravam.
// Sem DELETE: cancelar é mudar a situação para "cancelado".
@Controller('api/encontros')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_REGISTRO_ATIVIDADES)
export class EncontrosController {
  constructor(private readonly service: EncontrosService) {}

  @Get()
  @Perfis(...PERFIS_GESTAO)
  listar(
    @Query('atividadeId', ParseIntPipe) atividadeId: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.listarPorAtividade(atividadeId, usuario.organizacaoId);
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
    @Body() dados: CreateEncontroDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(dados, usuario.organizacaoId);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateEncontroDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dados, usuario.organizacaoId);
  }
}
