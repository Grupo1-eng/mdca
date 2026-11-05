import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { limitesDoMes, resumoSemanalDoMes } from './resumo-semanal';

// Lançamento não tem organizacao_id: pertence à organização da sua conta.
// Toda consulta filtra por `conta.organizacaoId` do token, e conta/projeto
// informados no corpo precisam ser da mesma organização. Registro de outra
// organização responde 404, como se não existisse.
@Injectable()
export class LancamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos(organizacaoId: number) {
    return this.prisma.lancamento.findMany({
      where: { conta: { organizacaoId } },
    });
  }

  async resumoSemanal(mes: string, organizacaoId: number) {
    const { inicio, fimExclusivo } = limitesDoMes(mes);
    const intervalo = { gte: inicio, lt: fimExclusivo };

    const lancamentos = await this.prisma.lancamento.findMany({
      where: {
        conta: { organizacaoId },
        OR: [
          { dataCompetencia: intervalo },
          { dataCompetencia: null, dataPagamento: intervalo },
          { dataCompetencia: null, dataPagamento: null, criadoEm: intervalo },
        ],
      },
      select: {
        tipo: true,
        valor: true,
        dataCompetencia: true,
        dataPagamento: true,
        criadoEm: true,
      },
    });

    return resumoSemanalDoMes(mes, lancamentos);
  }

  async buscarPorId(id: number, organizacaoId: number) {
    const lancamento = await this.prisma.lancamento.findFirst({
      where: { id, conta: { organizacaoId } },
    });
    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    return lancamento;
  }

  async criar(dados: CreateLancamentoDto, usuarioId: number, organizacaoId: number) {
    await this.validarVinculos(dados, organizacaoId);
    return this.prisma.lancamento.create({
      data: { ...dados, usuarioId },
    });
  }

  async atualizar(id: number, dados: UpdateLancamentoDto, organizacaoId: number) {
    await this.buscarPorId(id, organizacaoId);
    await this.validarVinculos(dados, organizacaoId);
    return this.prisma.lancamento.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number, organizacaoId: number) {
    await this.buscarPorId(id, organizacaoId);
    await this.prisma.lancamento.delete({ where: { id } });
  }

  private async validarVinculos(
    dados: { contaId?: number; projetoId?: number },
    organizacaoId: number,
  ) {
    if (dados.contaId !== undefined) {
      const conta = await this.prisma.contaFinanceira.findFirst({
        where: { id: dados.contaId, organizacaoId },
      });
      if (!conta) {
        throw new NotFoundException('Conta financeira não encontrada');
      }
    }
    if (dados.projetoId !== undefined && dados.projetoId !== null) {
      const projeto = await this.prisma.projeto.findFirst({
        where: { id: dados.projetoId, organizacaoId },
      });
      if (!projeto) {
        throw new NotFoundException('Projeto não encontrado');
      }
    }
  }
}
