import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateContatoDto } from './dto/create-contato.dto';
import { UpdateContatoDto } from './dto/update-contato.dto';

// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class ContatosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodos() {
    return this.prisma.contato.findMany();
  }

  async buscarPorId(id: number, db: Prisma.TransactionClient = this.prisma) {
    const contato = await db.contato.findUnique({
      where: { id },
    });
    if (!contato) {
      throw new NotFoundException('Contato não encontrado');
    }
    return contato;
  }

  async criar(dados: CreateContatoDto) {
    return this.prisma.$transaction(async (tx) => {
      const contato = await tx.contato.create({ data: dados });
      await this.auditoria.criacao(tx, 'contato', contato);
      return contato;
    });
  }

  async atualizar(id: number, dados: UpdateContatoDto) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, tx);
      const depois = await tx.contato.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'contato', antes, depois);
      return depois;
    });
  }

  async deletar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const contato = await this.buscarPorId(id, tx);
      await tx.contato.delete({ where: { id } });
      await this.auditoria.exclusao(tx, 'contato', contato);
    });
  }
}
