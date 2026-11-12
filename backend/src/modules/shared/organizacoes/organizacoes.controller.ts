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
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { PERFIS } from '../../auth/perfis.constants';
import { OrganizacoesService } from './organizacoes.service';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';

// Todo usuário logado consulta; só a coordenação cria, edita ou exclui.
@Controller('api/organizacoes')
@UseGuards(PerfisGuard)
export class OrganizacoesController {
  constructor(private readonly service: OrganizacoesService) {}

  @Get()
  listarTodas() {
    return this.service.listarTodas();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @Perfis(PERFIS.COORDENACAO)
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CreateOrganizacaoDto) {
    return this.service.criar(dados);
  }

  @Put(':id')
  @Perfis(PERFIS.COORDENACAO)
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dados: UpdateOrganizacaoDto) {
    return this.service.atualizar(id, dados);
  }

  @Delete(':id')
  @Perfis(PERFIS.COORDENACAO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id', ParseIntPipe) id: number) {
    await this.service.deletar(id);
  }
}
