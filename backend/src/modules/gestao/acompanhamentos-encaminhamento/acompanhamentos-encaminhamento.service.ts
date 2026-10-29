import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAcompanhamentoEncaminhamentoDto } from './dto/create-acompanhamento-encaminhamento.dto';

@Injectable()
export class AcompanhamentosEncaminhamentoService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async validarEncaminhamento(
    encaminhamentoId: number,
    organizacaoId: number,
  ) {
    const encaminhamento =
      await this.prisma.encaminhamento.findFirst({
        where: {
          id: encaminhamentoId,

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

    if (!encaminhamento) {
      throw new BadRequestException(
        'O encaminhamento informado não existe ou pertence a outra organização.',
      );
    }
  }

  async listarPorEncaminhamento(
    encaminhamentoId: number,
    organizacaoId: number,
  ) {
    await this.validarEncaminhamento(
      encaminhamentoId,
      organizacaoId,
    );

    return this.prisma.acompanhamentoEncaminhamento.findMany({
      where: {
        encaminhamentoId,
      },

      orderBy: {
        data: 'desc',
      },
    });
  }

  async buscarPorId(
    id: number,
    organizacaoId: number,
  ) {
    const acompanhamento =
      await this.prisma.acompanhamentoEncaminhamento.findFirst({
        where: {
          id,

          encaminhamento: {
            is: {
              educando: {
                is: {
                  organizacaoId,
                },
              },
            },
          },
        },
      });

    if (!acompanhamento) {
      throw new NotFoundException(
        'Acompanhamento de encaminhamento não encontrado.',
      );
    }

    return acompanhamento;
  }

  async criar(
    dados: CreateAcompanhamentoEncaminhamentoDto,
    organizacaoId: number,
  ) {
    await this.validarEncaminhamento(
      dados.encaminhamentoId,
      organizacaoId,
    );

    return this.prisma.$transaction(async (tx) => {
      const acompanhamento =
        await tx.acompanhamentoEncaminhamento.create({
          data: dados,
        });

      await tx.encaminhamento.update({
        where: {
          id: dados.encaminhamentoId,
        },

        data: {
          situacaoAtual: dados.situacao,
        },
      });

      return acompanhamento;
    });
  }
}