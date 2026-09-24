import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsuarioAutenticado } from '../../auth/decorators/usuario-atual.decorator';
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

// Todas as operações ficam restritas à organização de quem está autenticado.
@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos(organizacaoId: number) {
    return this.prisma.usuario.findMany({
      where: { organizacaoId },
      select: usuarioSelect,
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(id: number, organizacaoId: number) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, organizacaoId },
      select: usuarioSelect,
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async criar(dados: CreateUsuarioDto, organizacaoId: number) {
    const {
      senha,
      ...dadosUsuario
    } = dados;

    const senhaHash = await bcrypt.hash(senha, 10);

    const data: Prisma.UsuarioUncheckedCreateInput = {
      ...dadosUsuario,
      organizacaoId,
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
    autor: UsuarioAutenticado,
  ) {
    await this.buscarPorId(id, autor.organizacaoId);

    // Impede que a coordenação se tranque para fora: sem isso, a única conta
    // de coordenação poderia se rebaixar ou se desativar e ninguém mais
    // conseguiria gerenciar usuários.
    if (id === autor.id) {
      if (dados.perfil !== undefined && dados.perfil !== autor.perfil) {
        throw new BadRequestException('Você não pode alterar o próprio perfil.');
      }
      if (dados.ativo === false) {
        throw new BadRequestException('Você não pode inativar a própria conta.');
      }
    }

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

  async inativar(id: number, autor: UsuarioAutenticado) {
    await this.buscarPorId(id, autor.organizacaoId);

    if (id === autor.id) {
      throw new BadRequestException('Você não pode inativar a própria conta.');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ativo: false,
      },
      select: usuarioSelect,
    });
  }
}
