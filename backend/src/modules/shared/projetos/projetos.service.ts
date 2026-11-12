import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../auditorias/registro-auditoria.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';

// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class ProjetosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodos() {
    return this.prisma.projeto.findMany();
  }

  async buscarPorId(id: number, db: Prisma.TransactionClient = this.prisma) {
    const projeto = await db.projeto.findUnique({
      where: { id },
    });
    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }
    return projeto;
  }

  async criar(dados: CreateProjetoDto, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const projeto = await tx.projeto.create({ data: { ...dados, organizacaoId } });
      await this.auditoria.criacao(tx, 'projeto', projeto);
      return projeto;
    });
  }

  async atualizar(id: number, dados: UpdateProjetoDto) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, tx);
      const depois = await tx.projeto.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'projeto', antes, depois);
      return depois;
    });
  }

  async deletar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const projeto = await this.buscarPorId(id, tx);
      await tx.projeto.delete({ where: { id } });
      await this.auditoria.exclusao(tx, 'projeto', projeto);
    });
  }
}
