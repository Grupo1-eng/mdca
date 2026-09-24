import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContatoDto } from './dto/create-contato.dto';
import { UpdateContatoDto } from './dto/update-contato.dto';

@Injectable()
export class ContatosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.contato.findMany();
  }

  async buscarPorId(id: number) {
    const contato = await this.prisma.contato.findUnique({
      where: { id },
    });
    if (!contato) {
      throw new NotFoundException('Contato não encontrado');
    }
    return contato;
  }

  async criar(dados: CreateContatoDto) {
    return this.prisma.contato.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateContatoDto) {
    await this.buscarPorId(id);
    return this.prisma.contato.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.contato.delete({ where: { id } });
  }
}
