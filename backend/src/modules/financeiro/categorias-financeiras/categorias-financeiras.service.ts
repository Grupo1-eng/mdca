import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateCategoriaFinanceiraDto } from './dto/create-categoria-financeira.dto';
import { UpdateCategoriaFinanceiraDto } from './dto/update-categoria-financeira.dto';

// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class CategoriasFinanceirasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodas() {
    return this.prisma.categoriaFinanceira.findMany();
  }

  async buscarPorId(id: number, db: Prisma.TransactionClient = this.prisma) {
    const categoria = await db.categoriaFinanceira.findUnique({
      where: { id },
    });
    if (!categoria) {
      throw new NotFoundException('Categoria financeira não encontrada');
    }
    return categoria;
  }

  async criar(dados: CreateCategoriaFinanceiraDto) {
    return this.prisma.$transaction(async (tx) => {
      const categoria = await tx.categoriaFinanceira.create({ data: dados });
      await this.auditoria.criacao(tx, 'categoria_financeira', categoria);
      return categoria;
    });
  }

  async atualizar(id: number, dados: UpdateCategoriaFinanceiraDto) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, tx);
      const depois = await tx.categoriaFinanceira.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'categoria_financeira', antes, depois);
      return depois;
    });
  }

  async deletar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const categoria = await this.buscarPorId(id, tx);
      await tx.categoriaFinanceira.delete({ where: { id } });
      await this.auditoria.exclusao(tx, 'categoria_financeira', categoria);
    });
  }
}
