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
import { AcompanhamentosEncaminhamentoService } from './acompanhamentos-encaminhamento.service';
import { CreateAcompanhamentoEncaminhamentoDto } from './dto/create-acompanhamento-encaminhamento.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerfisGuard } from '../../auth/guards/perfis.guard';
import { Perfis } from '../../auth/decorators/perfis.decorator';
import { PERFIS_TECNICOS } from '../../auth/perfis.constants';

@Controller('api/acompanhamentos-encaminhamento')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(...PERFIS_TECNICOS)
export class AcompanhamentosEncaminhamentoController {
  constructor(
    private readonly service: AcompanhamentosEncaminhamentoService,
  ) {}

  @Get()
  listarPorEncaminhamento(
    @Query('encaminhamentoId', ParseIntPipe)
    encaminhamentoId: number,
  ) {
    return this.service.listarPorEncaminhamento(
      encaminhamentoId,
    );
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Body()
    dados: CreateAcompanhamentoEncaminhamentoDto,
  ) {
    return this.service.criar(dados);
  }
}
