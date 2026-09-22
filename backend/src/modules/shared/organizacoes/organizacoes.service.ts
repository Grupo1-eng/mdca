import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';

@Injectable()
export class OrganizacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodas() {
    return this.prisma.organizacao.findMany();
  }

  async buscarPorId(id: number) {
    const organizacao = await this.prisma.organizacao.findUnique({
      where: { id },
    });
    if (!organizacao) {
      throw new NotFoundException('Organização não encontrada');
    }
    return organizacao;
  }

  async criar(dados: CreateOrganizacaoDto) {
    return this.prisma.organizacao.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateOrganizacaoDto) {
    await this.buscarPorId(id);
    return this.prisma.organizacao.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.organizacao.delete({ where: { id } });
  }
}
