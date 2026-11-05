import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContaFinanceiraDto } from './dto/create-conta-financeira.dto';
import { UpdateContaFinanceiraDto } from './dto/update-conta-financeira.dto';

// Toda consulta filtra pela organização do token. Conta de outra
// organização responde 404, como se não existisse.
@Injectable()
export class ContasFinanceirasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodas(organizacaoId: number) {
    return this.prisma.contaFinanceira.findMany({ where: { organizacaoId } });
  }

  async buscarPorId(id: number, organizacaoId: number) {
    const conta = await this.prisma.contaFinanceira.findFirst({
      where: { id, organizacaoId },
    });
    if (!conta) {
      throw new NotFoundException('Conta financeira não encontrada');
    }
    return conta;
  }

  async criar(dados: CreateContaFinanceiraDto, organizacaoId: number) {
    return this.prisma.contaFinanceira.create({
      data: { ...dados, organizacaoId },
    });
  }

  async atualizar(id: number, dados: UpdateContaFinanceiraDto, organizacaoId: number) {
    await this.buscarPorId(id, organizacaoId);
    return this.prisma.contaFinanceira.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number, organizacaoId: number) {
    await this.buscarPorId(id, organizacaoId);
    await this.prisma.contaFinanceira.delete({ where: { id } });
  }
}
