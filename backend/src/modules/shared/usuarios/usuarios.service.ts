import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const usuarioSelect = {
  id: true,
  organizacaoId: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  criadoEm: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.usuario.findMany({
      select: usuarioSelect,
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: usuarioSelect,
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async criar(dados: CreateUsuarioDto) {
    const {
      senha,
      ...dadosUsuario
    } = dados;

    const senhaHash = await bcrypt.hash(senha, 10);

    const data: Prisma.UsuarioUncheckedCreateInput = {
      ...dadosUsuario,
      senhaHash,
    };

    return this.prisma.usuario.create({
      data,
      select: usuarioSelect,
    });
  }

  async atualizar(
    id: number,
    dados: UpdateUsuarioDto,
  ) {
    await this.buscarPorId(id);

    const {
      senha,
      ...dadosUsuario
    } = dados;

    const data: Prisma.UsuarioUncheckedUpdateInput = {
      ...dadosUsuario,
    };

    if (senha) {
      data.senhaHash = await bcrypt.hash(senha, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: usuarioSelect,
    });
  }

  async inativar(id: number) {
    await this.buscarPorId(id);

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ativo: false,
      },
      select: usuarioSelect,
    });
  }
}
