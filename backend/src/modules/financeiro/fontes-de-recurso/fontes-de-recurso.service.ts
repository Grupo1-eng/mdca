import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFonteDeRecursoDto } from './dto/create-fonte-de-recurso.dto';
import { UpdateFonteDeRecursoDto } from './dto/update-fonte-de-recurso.dto';

@Injectable()
export class FontesDeRecursoService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodas() {
    return this.prisma.fonteDeRecurso.findMany();
  }

  async buscarPorId(id: number) {
    const fonte = await this.prisma.fonteDeRecurso.findUnique({
      where: { id },
    });
    if (!fonte) {
      throw new NotFoundException('Fonte de recurso não encontrada');
    }
    return fonte;
  }

  async criar(dados: CreateFonteDeRecursoDto) {
    return this.prisma.fonteDeRecurso.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateFonteDeRecursoDto) {
    await this.buscarPorId(id);
    return this.prisma.fonteDeRecurso.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.fonteDeRecurso.delete({ where: { id } });
  }
}
