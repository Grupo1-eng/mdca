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
} from '@nestjs/common';
import { ContasFinanceirasService } from './contas-financeiras.service';
import { CreateContaFinanceiraDto } from './dto/create-conta-financeira.dto';
import { UpdateContaFinanceiraDto } from './dto/update-conta-financeira.dto';
import {
  UsuarioAtual,
  UsuarioAutenticado,
} from '../../auth/decorators/usuario-atual.decorator';

@Controller('api/contas-financeiras')
export class ContasFinanceirasController {
  constructor(private readonly service: ContasFinanceirasService) {}

  @Get()
  listarTodas() {
    return this.service.listarTodas();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CreateContaFinanceiraDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.criar(dados, usuario.organizacaoId);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dados: UpdateContaFinanceiraDto) {
    return this.service.atualizar(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id', ParseIntPipe) id: number) {
    await this.service.deletar(id);
  }
}
