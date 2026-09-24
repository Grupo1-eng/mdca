import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoriaFinanceiraDto } from './dto/create-categoria-financeira.dto';
import { UpdateCategoriaFinanceiraDto } from './dto/update-categoria-financeira.dto';

@Injectable()
export class CategoriasFinanceirasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodas() {
    return this.prisma.categoriaFinanceira.findMany();
  }

  async buscarPorId(id: number) {
    const categoria = await this.prisma.categoriaFinanceira.findUnique({
      where: { id },
    });
    if (!categoria) {
      throw new NotFoundException('Categoria financeira não encontrada');
    }
    return categoria;
  }

  async criar(dados: CreateCategoriaFinanceiraDto) {
    return this.prisma.categoriaFinanceira.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateCategoriaFinanceiraDto) {
    await this.buscarPorId(id);
    return this.prisma.categoriaFinanceira.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.categoriaFinanceira.delete({ where: { id } });
  }
}
