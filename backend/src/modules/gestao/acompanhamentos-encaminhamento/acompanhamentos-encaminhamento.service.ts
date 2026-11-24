import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAcompanhamentoEncaminhamentoDto } from './dto/create-acompanhamento-encaminhamento.dto';
import {
  EVOLUCAO_PARA_SIGILO,
  EvolucaoComAutor,
  Leitor,
  podeVerConteudo,
} from '../evolucoes/sigilo';

type UsuarioLeitor = Leitor & { organizacaoId: number };

// Encaminhamento ligado a evolução sigilosa de outro serviço: as observações
// dos acompanhamentos não vão para quem não vê a evolução (evolucoes/sigilo.ts).
function aplicarSigilo<T extends { observacao: string | null }>(
  acompanhamento: T,
  evolucao: EvolucaoComAutor | null | undefined,
  leitor: Leitor,
): T & { conteudoOculto: boolean } {
  if (!evolucao || podeVerConteudo(evolucao, leitor)) {
    return { ...acompanhamento, conteudoOculto: false };
  }
  return { ...acompanhamento, observacao: null, conteudoOculto: true };
}

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
          ...EVOLUCAO_PARA_SIGILO,
        },
      });

    if (!encaminhamento) {
      throw new BadRequestException(
        'O encaminhamento informado não existe ou pertence a outra organização.',
      );
    }

    return encaminhamento;
  }

  async listarPorEncaminhamento(
    encaminhamentoId: number,
    usuario: UsuarioLeitor,
  ) {
    const encaminhamento = await this.validarEncaminhamento(
      encaminhamentoId,
      usuario.organizacaoId,
    );

    const acompanhamentos =
      await this.prisma.acompanhamentoEncaminhamento.findMany({
        where: {
          encaminhamentoId,
        },

        orderBy: {
          data: 'desc',
        },
      });

    return acompanhamentos.map((a) =>
      aplicarSigilo(a, encaminhamento.evolucao, usuario),
    );
  }

  async buscarPorId(
    id: number,
    usuario: UsuarioLeitor,
  ) {
    const registro =
      await this.prisma.acompanhamentoEncaminhamento.findFirst({
        where: {
          id,

          encaminhamento: {
            is: {
              educando: {
                is: {
                  organizacaoId: usuario.organizacaoId,
                },
              },
            },
          },
        },

        include: {
          encaminhamento: { select: EVOLUCAO_PARA_SIGILO },
        },
      });

    if (!registro) {
      throw new NotFoundException(
        'Acompanhamento de encaminhamento não encontrado.',
      );
    }

    const { encaminhamento, ...acompanhamento } = registro;
    return aplicarSigilo(acompanhamento, encaminhamento?.evolucao, usuario);
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