import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { limitesDoMes, resumoSemanalDoMes } from './resumo-semanal';

@Injectable()
export class LancamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.lancamento.findMany();
  }

  async resumoSemanal(mes: string) {
    const { inicio, fimExclusivo } = limitesDoMes(mes);
    const intervalo = { gte: inicio, lt: fimExclusivo };

    const lancamentos = await this.prisma.lancamento.findMany({
      where: {
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

  async buscarPorId(id: number) {
    const lancamento = await this.prisma.lancamento.findUnique({
      where: { id },
    });
    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    return lancamento;
  }

  async criar(dados: CreateLancamentoDto, usuarioId: number) {
    return this.prisma.lancamento.create({
      data: { ...dados, usuarioId },
    });
  }

  async atualizar(id: number, dados: UpdateLancamentoDto) {
    await this.buscarPorId(id);
    return this.prisma.lancamento.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.lancamento.delete({ where: { id } });
  }
}
