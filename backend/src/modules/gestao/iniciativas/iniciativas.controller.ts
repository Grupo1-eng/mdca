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
  UseGuards,
} from '@nestjs/common';

import { Perfis } from '../../auth/decorators/perfis.decorator';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { CreateProjetoDto } from '../../shared/projetos/dto/create-projeto.dto';
import { UpdateProjetoDto } from '../../shared/projetos/dto/update-projeto.dto';
import { PERFIS_CADASTRO_INICIATIVA, PERFIS_GESTAO } from '../perfis-gestao';
import { IniciativasService } from './iniciativas.service';

// Todos os perfis da Gestão consultam; só a coordenação cadastra e edita.
// Sem DELETE: a iniciativa é encerrada pela situação "Concluído".
@Controller('api/iniciativas')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_GESTAO)
export class IniciativasController {
  constructor(private readonly service: IniciativasService) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listar(usuario.organizacaoId);
  }

  @Post()
  @Perfis(...PERFIS_CADASTRO_INICIATIVA)
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CreateProjetoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.criar(dados, usuario.organizacaoId);
  }

  @Put(':id')
  @Perfis(...PERFIS_CADASTRO_INICIATIVA)
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateProjetoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dados, usuario.organizacaoId);
  }
}
