import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCompromissoDto } from './dto/create-compromisso.dto';
import { UpdateCompromissoDto } from './dto/update-compromisso.dto';

@Injectable()
export class CompromissosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorPeriodo(
    inicio?: Date,
    fim?: Date,
  ) {
    return this.prisma.compromisso.findMany({
      where: {
        ...(inicio || fim
          ? {
              dataInicio: {
                ...(inicio ? { gte: inicio } : {}),
                ...(fim ? { lte: fim } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        dataInicio: 'asc',
      },
    });
  }

  async buscarPorId(id: number) {
    const compromisso =
      await this.prisma.compromisso.findUnique({
        where: { id },
      });

    if (!compromisso) {
      throw new NotFoundException(
        'Compromisso não encontrado',
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
    });
  }

  async atualizar(
    id: number,
    dados: UpdateCompromissoDto,
  ) {
    await this.buscarPorId(id);

    return this.prisma.compromisso.update({
      where: { id },
      data: dados,
    });
  }

  async cancelar(id: number) {
    await this.buscarPorId(id);

    return this.prisma.compromisso.update({
      where: { id },
      data: {
        situacao: 'cancelado',
      },
    });
  }
}
