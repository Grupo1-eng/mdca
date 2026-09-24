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
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS } from '../../auth/perfis.constants';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

@Controller('api/usuarios')
@UseGuards(JwtAuthGuard, PerfisGuard)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  listarTodos(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listarTodos(usuario.organizacaoId);
  }

  @Get(':id')
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.buscarPorId(id, usuario.organizacaoId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Perfis(PERFIS.COORDENACAO)
  criar(
    @Body() dados: CreateUsuarioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.criar(dados, usuario.organizacaoId);
  }

  @Put(':id')
  @Perfis(PERFIS.COORDENACAO)
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateUsuarioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dados, usuario);
  }

  @Patch(':id/inativar')
  @Perfis(PERFIS.COORDENACAO)
  inativar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.inativar(id, usuario);
  }
}
