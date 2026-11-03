import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EncaminhamentosService } from './encaminhamentos.service';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_TECNICOS } from '../../auth/perfis.constants';

@ApiTags('Encaminhamentos')
@ApiBearerAuth('access-token')
@Controller('api/encaminhamentos')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_TECNICOS)
export class EncaminhamentosController {
  constructor(
    private readonly service: EncaminhamentosService,
  ) {}

  @Get()
  listarPorEducando(
    @Query('educandoId', ParseIntPipe)
    educandoId: number,
  ) {
    return this.service.listarPorEducando(educandoId);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CreateEncaminhamentoDto) {
    return this.service.criar(dados);
  }
}
