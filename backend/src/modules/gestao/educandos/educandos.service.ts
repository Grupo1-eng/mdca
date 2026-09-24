import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEducandoDto } from './dto/create-educando.dto';
import { UpdateEducandoDto } from './dto/update-educando.dto';

@Injectable()
export class EducandosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos(apenasAtivos = true, nome?: string) {
    return this.prisma.educando.findMany({
      where: {
        ...(apenasAtivos ? { situacaoAtual: 'ativo' } : {}),
        ...(nome
          ? {
              nome: {
                contains: nome,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        dataNascimento: true,
        escola: true,
        turno: true,
        situacaoAtual: true,
        tecnicoResponsavel: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(id: number) {
    const educando = await this.prisma.educando.findUnique({
      where: { id },
      include: {
        responsaveis: true,
        tecnicoResponsavel: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!educando) {
      throw new NotFoundException('Educando não encontrado');
    }

    return educando;
  }

  private async verificarDuplicidade(
    cpf?: string,
    nis?: string,
    ignorarId?: number,
  ) {
    if (!cpf && !nis) {
      return;
    }

    const existente = await this.prisma.educando.findFirst({
      where: {
        OR: [
          ...(cpf ? [{ cpf }] : []),
          ...(nis ? [{ nis }] : []),
        ],
        ...(ignorarId
          ? {
              NOT: {
                id: ignorarId,
              },
            }
          : {}),
      },
    });

    if (existente) {
      throw new ConflictException(
        `Já existe um educando cadastrado com este CPF ou NIS ` +
          `(id: ${existente.id}, nome: ${existente.nome}).`,
      );
    }
  }

  async criar(dados: CreateEducandoDto) {
    await this.verificarDuplicidade(dados.cpf, dados.nis);

    return this.prisma.educando.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: UpdateEducandoDto) {
    await this.buscarPorId(id);

    if (dados.cpf || dados.nis) {
      await this.verificarDuplicidade(dados.cpf, dados.nis, id);
    }

    return this.prisma.educando.update({
      where: { id },
      data: dados,
    });
  }

  async inativar(id: number) {
    await this.buscarPorId(id);

    return this.prisma.educando.update({
      where: { id },
      data: {
        situacaoAtual: 'inativo',
      },
    });
  }

  async reativar(id: number) {
    await this.buscarPorId(id);

    return this.prisma.educando.update({
      where: { id },
      data: {
        situacaoAtual: 'ativo',
      },
    });
  }
}
