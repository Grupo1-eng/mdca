import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { PERFIS_FINANCEIRO } from '../../auth/perfis.constants';
import { ProjetosService } from './projetos.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

// Todo usuário logado consulta (a gestão também usa os projetos). Criar,
// editar e excluir fica com a coordenação e os perfis do financeiro.
@ApiTags('Projetos')
@ApiBearerAuth('access-token')
@Controller('api/projetos')
@UseGuards(PerfisGuard)
export class ProjetosController {
  constructor(private readonly service: ProjetosService) {}

  @Get()
  listarTodos() {
    return this.service.listarTodos();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @Perfis(...PERFIS_FINANCEIRO)
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CreateProjetoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.criar(dados, usuario.organizacaoId);
  }

  @Put(':id')
  @Perfis(...PERFIS_FINANCEIRO)
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dados: UpdateProjetoDto) {
    return this.service.atualizar(id, dados);
  }

  @Delete(':id')
  @Perfis(...PERFIS_FINANCEIRO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id', ParseIntPipe) id: number) {
    await this.service.deletar(id);
  }
}