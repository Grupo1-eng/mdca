import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';

@Injectable()
export class EvolucoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorEducando(educandoId: number) {
    return this.prisma.evolucao.findMany({
      where: { educandoId },
      orderBy: {
        dataInicio: 'desc',
      },
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
        encaminhamentos: true,
      },
    });
  }

  async buscarPorId(id: number) {
    const evolucao = await this.prisma.evolucao.findUnique({
      where: { id },
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
        encaminhamentos: {
          include: {
            acompanhamentos: true,
          },
        },
      },
    });

    if (!evolucao) {
      throw new NotFoundException('Evolução não encontrada');
    }

    return evolucao;
  }

  async criar(
    dados: CreateEvolucaoDto,
    profissionalId: number,
  ) {
    return this.prisma.evolucao.create({
      data: {
        ...dados,
        profissionalId,
      },
    });
  }

  async atualizar(
    id: number,
    dados: UpdateEvolucaoDto,
  ) {
    await this.buscarPorId(id);

    return this.prisma.evolucao.update({
      where: { id },
      data: dados,
    });
  }
}
