import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Só leitura. O cadastro e a edição ficam em gestao/iniciativas.
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
}
