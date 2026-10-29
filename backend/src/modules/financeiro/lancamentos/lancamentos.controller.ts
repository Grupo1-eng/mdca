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
import { LancamentosService } from './lancamentos.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_FINANCEIRO } from '../../auth/perfis.constants';

@Controller('api/lancamentos')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_FINANCEIRO)
export class LancamentosController {
  constructor(private readonly service: LancamentosService) {}

  @Get()
  listarTodos() {
    return this.service.listarTodos();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CreateLancamentoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.criar(dados, usuario.id);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dados: UpdateLancamentoDto) {
    return this.service.atualizar(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id', ParseIntPipe) id: number) {
    await this.service.deletar(id);
  }
}
