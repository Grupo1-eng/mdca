import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.usuario.findMany();
  }

  async buscarPorId(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return usuario;
  }

  async criar(dados: CreateUsuarioDto) {
    return this.prisma.usuario.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateUsuarioDto) {
    await this.buscarPorId(id);
    return this.prisma.usuario.update({
      where: { id },
      data: dados,
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.usuario.delete({ where: { id } });
  }
}
