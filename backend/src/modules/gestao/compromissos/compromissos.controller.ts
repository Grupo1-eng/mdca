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

import { CompromissosService } from './compromissos.service';
import { CreateCompromissoDto } from './dto/create-compromisso.dto';
import { UpdateCompromissoDto } from './dto/update-compromisso.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';

import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

@Controller('api/compromissos')
@UseGuards(JwtAuthGuard, PerfisGuard)
export class CompromissosController {
  constructor(
    private readonly service: CompromissosService,
  ) {}

  @Get()
  listarPorPeriodo(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
    @UsuarioAtual()
    usuario?: UsuarioAutenticado,
  ) {
    return this.service.listarPorPeriodo(
      inicio ? new Date(inicio) : undefined,
      fim ? new Date(fim) : undefined,
      usuario!.organizacaoId,
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
    dados: CreateCompromissoDto,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(
      dados,
      usuario.id,
    );
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dados: UpdateCompromissoDto,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(
      id,
      dados,
      usuario.organizacaoId,
    );
  }

  @Patch(':id/cancelar')
  cancelar(
    @Param('id', ParseIntPipe)
    id: number,

    @UsuarioAtual()
    usuario: UsuarioAutenticado,
  ) {
    return this.service.cancelar(
      id,
      usuario.organizacaoId,
    );
  }
}