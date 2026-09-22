import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';

@Injectable()
export class ProjetosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.projeto.findMany();
  }

  async buscarPorId(id: number) {
    const projeto = await this.prisma.projeto.findUnique({
      where: { id },
    });
    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }
    return projeto;
  }

  async criar(dados: CreateProjetoDto) {
    return this.prisma.projeto.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateProjetoDto) {
    await this.buscarPorId(id);
    return this.prisma.projeto.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.projeto.delete({ where: { id } });
  }
}
