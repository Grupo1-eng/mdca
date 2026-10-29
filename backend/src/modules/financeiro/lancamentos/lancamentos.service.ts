import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';

// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class LancamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodos() {
    return this.prisma.lancamento.findMany();
  }

  async buscarPorId(id: number, db: Prisma.TransactionClient = this.prisma) {
    const lancamento = await db.lancamento.findUnique({
      where: { id },
    });
    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    return lancamento;
  }

  async criar(dados: CreateLancamentoDto, usuarioId: number) {
    return this.prisma.$transaction(async (tx) => {
      const lancamento = await tx.lancamento.create({ data: { ...dados, usuarioId } });
      await this.auditoria.criacao(tx, 'lancamento', lancamento);
      return lancamento;
    });
  }

  async atualizar(id: number, dados: UpdateLancamentoDto) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, tx);
      const depois = await tx.lancamento.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'lancamento', antes, depois);
      return depois;
    });
  }

  async deletar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const lancamento = await this.buscarPorId(id, tx);
      await tx.lancamento.delete({ where: { id } });
      await this.auditoria.exclusao(tx, 'lancamento', lancamento);
    });
  }
}
