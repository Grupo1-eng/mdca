import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateResponsavelFamiliarDto } from './dto/create-responsavel-familiar.dto';
import { UpdateResponsavelFamiliarDto } from './dto/update-responsavel-familiar.dto';

@Injectable()
export class ResponsaveisFamiliaresService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listarTodos(
    organizacaoId: number,
  ) {
    return this.prisma.responsavelFamiliar.findMany({
      where: {
        educando: {
          is: {
            organizacaoId,
          },
        },
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
    const responsavel =
      await this.prisma.responsavelFamiliar.findFirst({
        where: {
          id,

          educando: {
            is: {
              organizacaoId,
            },
          },
        },
      });

    if (!responsavel) {
      throw new NotFoundException(
        'Responsável familiar não encontrado.',
      );
    }

    return responsavel;
  }

  private async validarEducando(
    educandoId: number,
    organizacaoId: number,
  ) {
    const educando =
      await this.prisma.educando.findFirst({
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

  async criar(
    dados: CreateResponsavelFamiliarDto,
    organizacaoId: number,
  ) {
    await this.validarEducando(
      dados.educandoId,
      organizacaoId,
    );

    return this.prisma.responsavelFamiliar.create({
      data: dados,
    });
  }

  async atualizar(
    id: number,
    dados: UpdateResponsavelFamiliarDto,
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

    return this.prisma.responsavelFamiliar.update({
      where: {
        id,
      },

      data: dados,
    });
  }
}