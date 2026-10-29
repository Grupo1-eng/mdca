import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompromissoDto } from './dto/create-compromisso.dto';
import { UpdateCompromissoDto } from './dto/update-compromisso.dto';

@Injectable()
export class CompromissosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listarPorPeriodo(
    inicio: Date | undefined,
    fim: Date | undefined,
    organizacaoId: number,
  ) {
    const where: Prisma.CompromissoWhereInput = {
      criador: {
        is: {
          organizacaoId,
        },
      },
    };

    if (inicio || fim) {
      where.dataInicio = {
        ...(inicio ? { gte: inicio } : {}),
        ...(fim ? { lte: fim } : {}),
      };
    }

    return this.prisma.compromisso.findMany({
      where,

      include: {
        criador: {
          select: {
            id: true,
            nome: true,
          },
        },
      },

      orderBy: {
        dataInicio: 'asc',
      },
    });
  }

  async buscarPorId(
    id: number,
    organizacaoId: number,
  ) {
    const compromisso =
      await this.prisma.compromisso.findFirst({
        where: {
          id,

          criador: {
            is: {
              organizacaoId,
            },
          },
        },

        include: {
          criador: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    if (!compromisso) {
      throw new NotFoundException(
        'Compromisso não encontrado.',
      );
    }

    return compromisso;
  }

  async criar(
    dados: CreateCompromissoDto,
    criadorId: number,
  ) {
    return this.prisma.compromisso.create({
      data: {
        ...dados,
        criadorId,
        situacao: 'agendado',
      },

      include: {
        criador: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async atualizar(
    id: number,
    dados: UpdateCompromissoDto,
    organizacaoId: number,
  ) {
    await this.buscarPorId(
      id,
      organizacaoId,
    );

    return this.prisma.compromisso.update({
      where: {
        id,
      },

      data: dados,

      include: {
        criador: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async cancelar(
    id: number,
    organizacaoId: number,
  ) {
    await this.buscarPorId(
      id,
      organizacaoId,
    );

    return this.prisma.compromisso.update({
      where: {
        id,
      },

      data: {
        situacao: 'cancelado',
      },

      include: {
        criador: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }
}