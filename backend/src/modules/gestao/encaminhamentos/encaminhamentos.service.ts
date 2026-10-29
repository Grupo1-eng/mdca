import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';

@Injectable()
export class EncaminhamentosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async validarEducando(
    educandoId: number,
    organizacaoId: number,
  ) {
    const educando = await this.prisma.educando.findFirst({
      where: {
        id: educandoId,
        organizacaoId,
      },

      select: {
        id: true,
      },
    });

    if (!educando) {
      throw new BadRequestException(
        'O educando informado não existe ou pertence a outra organização.',
      );
    }
  }

  private async validarEvolucao(
    evolucaoId: number | undefined,
    educandoId: number,
    organizacaoId: number,
  ) {
    if (evolucaoId === undefined) {
      return;
    }

    const evolucao = await this.prisma.evolucao.findFirst({
      where: {
        id: evolucaoId,
        educandoId,

        educando: {
          is: {
            organizacaoId,
          },
        },
      },

      select: {
        id: true,
      },
    });

    if (!evolucao) {
      throw new BadRequestException(
        'A evolução informada não existe, pertence a outro educando ou a outra organização.',
      );
    }
  }

  async listarPorEducando(
    educandoId: number,
    organizacaoId: number,
  ) {
    await this.validarEducando(
      educandoId,
      organizacaoId,
    );

    return this.prisma.encaminhamento.findMany({
      where: {
        educandoId,

        educando: {
          is: {
            organizacaoId,
          },
        },
      },

      include: {
        acompanhamentos: {
          orderBy: {
            data: 'desc',
          },
        },
      },

      orderBy: {
        dataEncaminhamento: 'desc',
      },
    });
  }

  async buscarPorId(
    id: number,
    organizacaoId: number,
  ) {
    const encaminhamento =
      await this.prisma.encaminhamento.findFirst({
        where: {
          id,

          educando: {
            is: {
              organizacaoId,
            },
          },
        },

        include: {
          acompanhamentos: {
            orderBy: {
              data: 'desc',
            },
          },
        },
      });

    if (!encaminhamento) {
      throw new NotFoundException(
        'Encaminhamento não encontrado.',
      );
    }

    return encaminhamento;
  }

  async criar(
    dados: CreateEncaminhamentoDto,
    organizacaoId: number,
  ) {
    await this.validarEducando(
      dados.educandoId,
      organizacaoId,
    );

    await this.validarEvolucao(
      dados.evolucaoId,
      dados.educandoId,
      organizacaoId,
    );

    return this.prisma.encaminhamento.create({
      data: dados,
    });
  }
}