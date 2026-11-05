import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateContaFinanceiraDto } from './dto/create-conta-financeira.dto';
import { UpdateContaFinanceiraDto } from './dto/update-conta-financeira.dto';

// Toda consulta filtra pela organização do token. Conta de outra
// organização responde 404, como se não existisse.
// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class ContasFinanceirasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodas(organizacaoId: number) {
    return this.prisma.contaFinanceira.findMany({ where: { organizacaoId } });
  }

  async buscarPorId(
    id: number,
    organizacaoId: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const conta = await db.contaFinanceira.findFirst({
      where: { id, organizacaoId },
    });
    if (!conta) {
      throw new NotFoundException('Conta financeira não encontrada');
    }
    return conta;
  }

  async criar(dados: CreateContaFinanceiraDto, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const conta = await tx.contaFinanceira.create({ data: { ...dados, organizacaoId } });
      await this.auditoria.criacao(tx, 'conta_financeira', conta);
      return conta;
    });
  }

  async atualizar(id: number, dados: UpdateContaFinanceiraDto, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, organizacaoId, tx);
      const depois = await tx.contaFinanceira.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'conta_financeira', antes, depois);
      return depois;
    });
  }

  async deletar(id: number, organizacaoId: number) {
    await this.prisma.$transaction(async (tx) => {
      const conta = await this.buscarPorId(id, organizacaoId, tx);
      await tx.contaFinanceira.delete({ where: { id } });
      await this.auditoria.exclusao(tx, 'conta_financeira', conta);
    });
  }
}
