import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';

@Injectable()
export class LancamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.lancamento.findMany();
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
