import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';

// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class OrcamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodos() {
    return this.prisma.orcamento.findMany();
  }

  async buscarPorId(id: number, db: Prisma.TransactionClient = this.prisma) {
    const orcamento = await db.orcamento.findUnique({
      where: { id },
    });
    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }
    return orcamento;
  }

  async criar(dados: CreateOrcamentoDto) {
    return this.prisma.$transaction(async (tx) => {
      const orcamento = await tx.orcamento.create({ data: dados });
      await this.auditoria.criacao(tx, 'orcamento', orcamento);
      return orcamento;
    });
  }

  async atualizar(id: number, dados: UpdateOrcamentoDto) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, tx);
      const depois = await tx.orcamento.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'orcamento', antes, depois);
      return depois;
    });
  }

  async deletar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const orcamento = await this.buscarPorId(id, tx);
      await tx.orcamento.delete({ where: { id } });
      await this.auditoria.exclusao(tx, 'orcamento', orcamento);
    });
  }
}
