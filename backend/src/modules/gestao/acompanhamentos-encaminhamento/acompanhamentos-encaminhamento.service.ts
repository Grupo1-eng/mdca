import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAcompanhamentoEncaminhamentoDto } from './dto/create-acompanhamento-encaminhamento.dto';

@Injectable()
export class AcompanhamentosEncaminhamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorEncaminhamento(
    encaminhamentoId: number,
  ) {
    return this.prisma.acompanhamentoEncaminhamento.findMany({
      where: { encaminhamentoId },
      orderBy: {
        data: 'desc',
      },
    });
  }

  async buscarPorId(id: number) {
    const acompanhamento =
      await this.prisma.acompanhamentoEncaminhamento.findUnique({
        where: { id },
      });

    if (!acompanhamento) {
      throw new NotFoundException(
        'Acompanhamento de encaminhamento não encontrado',
      );
    }

    return acompanhamento;
  }

  async criar(
    dados: CreateAcompanhamentoEncaminhamentoDto,
  ) {
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
