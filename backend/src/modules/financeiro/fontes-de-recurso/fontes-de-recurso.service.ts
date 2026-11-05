import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateFonteDeRecursoDto } from './dto/create-fonte-de-recurso.dto';
import { UpdateFonteDeRecursoDto } from './dto/update-fonte-de-recurso.dto';

// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class FontesDeRecursoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodas() {
    return this.prisma.fonteDeRecurso.findMany();
  }

  async buscarPorId(id: number, db: Prisma.TransactionClient = this.prisma) {
    const fonte = await db.fonteDeRecurso.findUnique({
      where: { id },
    });
    if (!fonte) {
      throw new NotFoundException('Fonte de recurso não encontrada');
    }
    return fonte;
  }

  async criar(dados: CreateFonteDeRecursoDto) {
    return this.prisma.$transaction(async (tx) => {
      const fonte = await tx.fonteDeRecurso.create({ data: dados });
      await this.auditoria.criacao(tx, 'fonte_de_recurso', fonte);
      return fonte;
    });
  }

  async atualizar(id: number, dados: UpdateFonteDeRecursoDto) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, tx);
      const depois = await tx.fonteDeRecurso.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'fonte_de_recurso', antes, depois);
      return depois;
    });
  }

  async deletar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const fonte = await this.buscarPorId(id, tx);
      await tx.fonteDeRecurso.delete({ where: { id } });
      await this.auditoria.exclusao(tx, 'fonte_de_recurso', fonte);
    });
  }
}
