import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';

@Injectable()
export class EncaminhamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorEducando(educandoId: number) {
    return this.prisma.encaminhamento.findMany({
      where: { educandoId },
      orderBy: {
        dataEncaminhamento: 'desc',
      },
      include: {
        acompanhamentos: {
          orderBy: {
            data: 'desc',
          },
        },
      },
    });
  }

  async buscarPorId(id: number) {
    const encaminhamento =
      await this.prisma.encaminhamento.findUnique({
        where: { id },
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
        'Encaminhamento não encontrado',
      );
    }

    return encaminhamento;
  }

  async criar(dados: CreateEncaminhamentoDto) {
    return this.prisma.encaminhamento.create({
      data: dados,
    });
  }
}
