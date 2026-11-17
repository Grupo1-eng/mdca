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
import { AtividadesService } from './atividades.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';

// Todos os perfis da Gestão consultam; coordenação e educador gravam.
// Sem DELETE: a atividade é encerrada.
@Controller('api/atividades')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_REGISTRO_ATIVIDADES)
export class AtividadesController {
  constructor(private readonly service: AtividadesService) {}

  // Antes de ':id', para "responsaveis" não ser lido como id.
  @Get('responsaveis')
  @Perfis(...PERFIS_GESTAO)
  listarResponsaveis(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listarResponsaveis(usuario.organizacaoId);
  }

  @Get()
  @Perfis(...PERFIS_GESTAO)
  listar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('projetoId') projetoId?: string,
    @Query('situacao') situacao?: string,
  ) {
    return this.service.listar(usuario.organizacaoId, {
      projetoId: projetoId ? Number(projetoId) || undefined : undefined,
      situacao: situacao || undefined,
    });
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
    @Body() dados: CreateAtividadeDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(dados, usuario.organizacaoId);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateAtividadeDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dados, usuario.organizacaoId);
  }
}
