import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContaFinanceiraDto } from './dto/create-conta-financeira.dto';
import { UpdateContaFinanceiraDto } from './dto/update-conta-financeira.dto';

@Injectable()
export class ContasFinanceirasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodas() {
    return this.prisma.contaFinanceira.findMany();
  }

  async buscarPorId(id: number) {
    const conta = await this.prisma.contaFinanceira.findUnique({
      where: { id },
    });
    if (!conta) {
      throw new NotFoundException('Conta financeira não encontrada');
    }
    return conta;
  }

  async criar(dados: CreateContaFinanceiraDto) {
    return this.prisma.contaFinanceira.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateContaFinanceiraDto) {
    await this.buscarPorId(id);
    return this.prisma.contaFinanceira.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.contaFinanceira.delete({ where: { id } });
  }
}
