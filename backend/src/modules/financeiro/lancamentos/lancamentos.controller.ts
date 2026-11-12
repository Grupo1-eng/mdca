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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LancamentosService } from './lancamentos.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { ResumoSemanalQueryDto, SEM_PROJETO } from './dto/resumo-semanal-query.dto';
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
  listarTodos(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.listarTodos(usuario.organizacaoId);
  }

  @ApiTags('Lançamentos')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Resumo semanal de entradas e saídas de um mês',
    description:
      'Agrupa os lançamentos do mês em semanas de 7 dias, contadas a partir do dia 1 ' +
      '(1-7, 8-14, 15-21, 22-28 e 29 até o fim do mês). Valores em reais, com 2 casas.',
  })
  @ApiResponse({ status: 200, description: 'Semanas do mês com entradas, saídas e saldo.' })
  @ApiResponse({ status: 400, description: 'Mês ausente ou fora do formato AAAA-MM.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Perfil sem acesso ao módulo financeiro.' })
  @Get('resumo-semanal')
  resumoSemanal(
    @Query() query: ResumoSemanalQueryDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    const projetoId =
      query.projetoId === undefined ? undefined : query.projetoId === SEM_PROJETO ? null : Number(query.projetoId);
    return this.service.resumoSemanal(query.mes, usuario.organizacaoId, projetoId);
  }

  @Get(':id')
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.buscarPorId(id, usuario.organizacaoId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CreateLancamentoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.criar(dados, usuario.id, usuario.organizacaoId);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateLancamentoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dados, usuario.organizacaoId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    await this.service.deletar(id, usuario.organizacaoId);
  }
}
