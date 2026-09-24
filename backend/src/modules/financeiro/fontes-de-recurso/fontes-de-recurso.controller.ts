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
import { FontesDeRecursoService } from './fontes-de-recurso.service';
import { CreateFonteDeRecursoDto } from './dto/create-fonte-de-recurso.dto';
import { UpdateFonteDeRecursoDto } from './dto/update-fonte-de-recurso.dto';

@Controller('api/fontes-de-recurso')
export class FontesDeRecursoController {
  constructor(private readonly service: FontesDeRecursoService) {}

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
  criar(@Body() dados: CreateFonteDeRecursoDto) {
    return this.service.criar(dados);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dados: UpdateFonteDeRecursoDto) {
    return this.service.atualizar(id, dados);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id', ParseIntPipe) id: number) {
    await this.service.deletar(id);
  }
}
