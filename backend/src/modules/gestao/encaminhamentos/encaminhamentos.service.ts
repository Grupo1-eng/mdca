import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';
import {
  EVOLUCAO_PARA_SIGILO,
  Leitor,
  aplicarSigiloEncaminhamento,
} from '../evolucoes/sigilo';

type UsuarioLeitor = Leitor & { organizacaoId: number };

// Nome de quem registrou o encaminhamento, para a linha do tempo da ficha.
const PROFISSIONAL = {
  profissional: { select: { id: true, nome: true } },
} as const;

// Itens nas listas do painel dos técnicos.
const LIMITE_PAINEL = 8;

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
    usuario: UsuarioLeitor,
  ) {
    await this.validarEducando(
      educandoId,
      usuario.organizacaoId,
    );

    const encaminhamentos = await this.prisma.encaminhamento.findMany({
      where: {
        educandoId,

        educando: {
          is: {
            organizacaoId: usuario.organizacaoId,
          },
        },
      },

      include: {
        ...PROFISSIONAL,
        ...EVOLUCAO_PARA_SIGILO,
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

    // Ligado a uma evolução sigilosa de outro serviço: sem a descrição.
    return encaminhamentos.map((encaminhamento) =>
      aplicarSigiloEncaminhamento(encaminhamento, usuario),
    );
  }

  // Sem descrição nem acompanhamentos: só o que a lista do painel mostra
  // (educando, destino, data e situação), sem conteúdo sigiloso.
  async listarEmAberto(organizacaoId: number, limite = LIMITE_PAINEL) {
    return this.prisma.encaminhamento.findMany({
      where: {
        educando: { is: { organizacaoId } },
        NOT: { situacaoAtual: { equals: 'efetivado', mode: 'insensitive' } },
      },
      select: {
        id: true,
        destino: true,
        dataEncaminhamento: true,
        situacaoAtual: true,
        educando: { select: { id: true, nome: true } },
      },
      orderBy: { dataEncaminhamento: 'asc' },
      take: limite,
    });
  }

  async buscarPorId(
    id: number,
    usuario: UsuarioLeitor,
  ) {
    const encaminhamento =
      await this.prisma.encaminhamento.findFirst({
        where: {
          id,

          educando: {
            is: {
              organizacaoId: usuario.organizacaoId,
            },
          },
        },

        include: {
          ...PROFISSIONAL,
          ...EVOLUCAO_PARA_SIGILO,
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

    return aplicarSigiloEncaminhamento(encaminhamento, usuario);
  }

  async criar(
    dados: CreateEncaminhamentoDto,
    profissionalId: number,
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
      data: {
        ...dados,
        profissionalId,
      },
      include: PROFISSIONAL,
    });
  }
}