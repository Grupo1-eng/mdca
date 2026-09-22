import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.orcamento.findMany();
  }

  async buscarPorId(id: number) {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
    });
    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }
    return orcamento;
  }

  async criar(dados: CreateOrcamentoDto) {
    return this.prisma.orcamento.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateOrcamentoDto) {
    await this.buscarPorId(id);
    return this.prisma.orcamento.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.orcamento.delete({ where: { id } });
  }
}
