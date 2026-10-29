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
import { ContatosService } from './contatos.service';
import { CreateContatoDto } from './dto/create-contato.dto';
import { UpdateContatoDto } from './dto/update-contato.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_FINANCEIRO } from '../../auth/perfis.constants';

@Controller('api/contatos')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_FINANCEIRO)
export class ContatosController {
  constructor(private readonly service: ContatosService) {}

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
  criar(@Body() dados: CreateContatoDto) {
    return this.service.criar(dados);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dados: UpdateContatoDto) {
    return this.service.atualizar(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id', ParseIntPipe) id: number) {
    await this.service.deletar(id);
  }
}
