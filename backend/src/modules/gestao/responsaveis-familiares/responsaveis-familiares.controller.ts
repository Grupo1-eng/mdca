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
import { ResponsaveisFamiliaresService } from './responsaveis-familiares.service';
import { CreateResponsavelFamiliarDto } from './dto/create-responsavel-familiar.dto';
import { UpdateResponsavelFamiliarDto } from './dto/update-responsavel-familiar.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_TECNICOS } from '../../auth/perfis.constants';

@Controller('api/responsaveis-familiares')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_TECNICOS)
export class ResponsaveisFamiliaresController {
  constructor(
    private readonly service: ResponsaveisFamiliaresService,
  ) {}

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
  criar(@Body() dados: CreateResponsavelFamiliarDto) {
    return this.service.criar(dados);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateResponsavelFamiliarDto,
  ) {
    return this.service.atualizar(id, dados);
  }
}
