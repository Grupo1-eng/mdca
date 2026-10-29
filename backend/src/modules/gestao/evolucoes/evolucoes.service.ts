import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';

@Injectable()
export class EvolucoesService {
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

  private async validarProjeto(
    projetoId: number | undefined,
    organizacaoId: number,
  ) {
    if (projetoId === undefined) {
      return;
    }

    const projeto = await this.prisma.projeto.findFirst({
      where: {
        id: projetoId,
        organizacaoId,
      },
      select: {
        id: true,
      },
    });

    if (!projeto) {
      throw new BadRequestException(
        'O projeto, serviço ou programa informado não existe ou pertence a outra organização.',
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

    return this.prisma.evolucao.findMany({
      where: {
        educandoId,

        educando: {
          is: {
            organizacaoId,
          },
        },
      },

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

  async buscarPorId(
    id: number,
    organizacaoId: number,
  ) {
    const evolucao = await this.prisma.evolucao.findFirst({
      where: {
        id,

        educando: {
          is: {
            organizacaoId,
          },
        },
      },

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
      throw new NotFoundException(
        'Evolução não encontrada.',
      );
    }

    return evolucao;
  }

  async criar(
    dados: CreateEvolucaoDto,
    profissionalId: number,
    organizacaoId: number,
  ) {
    await this.validarEducando(
      dados.educandoId,
      organizacaoId,
    );

    await this.validarProjeto(
      dados.projetoId,
      organizacaoId,
    );

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
    organizacaoId: number,
  ) {
    await this.buscarPorId(
      id,
      organizacaoId,
    );

    if (dados.educandoId !== undefined) {
      await this.validarEducando(
        dados.educandoId,
        organizacaoId,
      );
    }

    if (dados.projetoId !== undefined) {
      await this.validarProjeto(
        dados.projetoId,
        organizacaoId,
      );
    }

    return this.prisma.evolucao.update({
      where: {
        id,
      },

      data: dados,
    });
  }
}