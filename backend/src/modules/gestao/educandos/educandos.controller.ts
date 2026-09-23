import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EducandosService } from './educandos.service';
import { CreateEducandoDto } from './dto/create-educando.dto';
import { UpdateEducandoDto } from './dto/update-educando.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import {
  PERFIS,
  PERFIS_TECNICOS,
} from '../../auth/perfis.constants';

@Controller('api/educandos')
@UseGuards(JwtAuthGuard, PerfisGuard)
export class EducandosController {
  constructor(private readonly service: EducandosService) {}

  @Get()
  listarTodos(
    @Query(
      'apenasAtivos',
      new ParseBoolPipe({ optional: true }),
    )
    apenasAtivos?: boolean,
    @Query('nome') nome?: string,
  ) {
    return this.service.listarTodos(
      apenasAtivos ?? true,
      nome,
    );
  }

  @Get(':id')
  @Perfis(...PERFIS_TECNICOS)
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Perfis(...PERFIS_TECNICOS)
  criar(@Body() dados: CreateEducandoDto) {
    return this.service.criar(dados);
  }

  @Put(':id')
  @Perfis(...PERFIS_TECNICOS)
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateEducandoDto,
  ) {
    return this.service.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  @Perfis(PERFIS.COORDENACAO)
  inativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.inativar(id);
  }

  @Patch(':id/reativar')
  @Perfis(PERFIS.COORDENACAO)
  reativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.reativar(id);
  }
}
