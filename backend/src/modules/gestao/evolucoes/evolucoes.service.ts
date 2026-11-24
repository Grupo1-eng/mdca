import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';
import {
  Leitor,
  aplicarSigiloEvolucao,
  podeVerConteudo,
} from './sigilo';

// Quem registrou; o perfil decide quem vê uma evolução sigilosa (sigilo.ts).
const PROFISSIONAL = {
  profissional: {
    select: {
      id: true,
      nome: true,
      perfil: true,
    },
  },
} as const;

type UsuarioLeitor = Leitor & { organizacaoId: number };

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
    usuario: UsuarioLeitor,
  ) {
    await this.validarEducando(
      educandoId,
      usuario.organizacaoId,
    );

    const evolucoes = await this.prisma.evolucao.findMany({
      where: {
        educandoId,

        educando: {
          is: {
            organizacaoId: usuario.organizacaoId,
          },
        },
      },

      orderBy: {
        dataInicio: 'desc',
      },

      include: {
        ...PROFISSIONAL,

        encaminhamentos: true,
      },
    });

    return evolucoes.map((evolucao) =>
      aplicarSigiloEvolucao(evolucao, usuario),
    );
  }

  private async buscarRegistro(
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
        ...PROFISSIONAL,

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

  async buscarPorId(
    id: number,
    usuario: UsuarioLeitor,
  ) {
    const evolucao = await this.buscarRegistro(
      id,
      usuario.organizacaoId,
    );

    return aplicarSigiloEvolucao(evolucao, usuario);
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
    usuario: UsuarioLeitor,
  ) {
    const { organizacaoId } = usuario;
    const evolucao = await this.buscarRegistro(
      id,
      organizacaoId,
    );

    // Quem não vê o conteúdo também não altera (nem tira o sigilo).
    if (!podeVerConteudo(evolucao, usuario)) {
      throw new ForbiddenException(
        'Evolução sigilosa: só o serviço de quem registrou e a coordenação podem alterá-la.',
      );
    }

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