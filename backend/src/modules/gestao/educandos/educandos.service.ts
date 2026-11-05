import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEducandoDto } from './dto/create-educando.dto';
import { UpdateEducandoDto } from './dto/update-educando.dto';

@Injectable()
export class EducandosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos(
    organizacaoId: number,
    apenasAtivos = true,
    nome?: string,
  ) {
    return this.prisma.educando.findMany({
      where: {
        organizacaoId,

        ...(apenasAtivos
          ? {
              situacaoAtual: 'ativo',
            }
          : {}),

        ...(nome
          ? {
              nome: {
                contains: nome,
                mode: 'insensitive',
              },
            }
          : {}),
      },

      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(
    id: number,
    organizacaoId: number,
  ) {
    const educando = await this.prisma.educando.findFirst({
      where: {
        id,
        organizacaoId,
      },

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
      throw new NotFoundException('Educando não encontrado.');
    }

    return educando;
  }

  private async verificarDuplicidade(
    organizacaoId: number,
    cpf?: string,
    nis?: string,
    ignorarId?: number,
  ) {
    if (!cpf && !nis) {
      return;
    }

    const existente = await this.prisma.educando.findFirst({
      where: {
        organizacaoId,

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
          `(id: ${existente.id}, nome: ${existente.nome}). ` +
          'Confirme se não é um cadastro duplicado antes de prosseguir.',
      );
    }
  }

  private async validarTecnicoResponsavel(
    tecnicoResponsavelId: number | undefined,
    organizacaoId: number,
  ) {
    if (tecnicoResponsavelId === undefined) {
      return;
    }

    const tecnico = await this.prisma.usuario.findFirst({
      where: {
        id: tecnicoResponsavelId,
        organizacaoId,
        ativo: true,
      },

      select: {
        id: true,
      },
    });

    if (!tecnico) {
      throw new BadRequestException(
        'O técnico responsável informado não existe, está inativo ou pertence a outra organização.',
      );
    }
  }

  async criar(
    dados: CreateEducandoDto,
    organizacaoId: number,
  ) {
    await this.verificarDuplicidade(
      organizacaoId,
      dados.cpf,
      dados.nis,
    );

    await this.validarTecnicoResponsavel(
      dados.tecnicoResponsavelId,
      organizacaoId,
    );

    const data: Prisma.EducandoUncheckedCreateInput = {
      ...dados,
      organizacaoId,
    };

    return this.prisma.educando.create({
      data,
    });
  }

  async atualizar(
    id: number,
    dados: UpdateEducandoDto,
    organizacaoId: number,
  ) {
    await this.buscarPorId(id, organizacaoId);

    if (dados.cpf || dados.nis) {
      await this.verificarDuplicidade(
        organizacaoId,
        dados.cpf,
        dados.nis,
        id,
      );
    }

    if (dados.tecnicoResponsavelId !== undefined) {
      await this.validarTecnicoResponsavel(
        dados.tecnicoResponsavelId,
        organizacaoId,
      );
    }

    const data: Prisma.EducandoUncheckedUpdateInput = {
      ...dados,
    };

    return this.prisma.educando.update({
      where: {
        id,
      },
      data,
    });
  }

  async inativar(
    id: number,
    organizacaoId: number,
  ) {
    await this.buscarPorId(id, organizacaoId);

    return this.prisma.educando.update({
      where: {
        id,
      },
      data: {
        situacaoAtual: 'inativo',
      },
    });
  }

  async reativar(
    id: number,
    organizacaoId: number,
  ) {
    await this.buscarPorId(id, organizacaoId);

    return this.prisma.educando.update({
      where: {
        id,
      },
      data: {
        situacaoAtual: 'ativo',
      },
    });
  }
}