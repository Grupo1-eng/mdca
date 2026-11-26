import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { SITUACAO_VINCULO_ATIVO } from '../educando-projetos/educando-projetos.service';
import {
  AUSENCIA,
  PRESENCA,
  aceitaChamada,
  garantirEncontro,
  intervaloDeDias,
} from '../atividades/regras-atividades';
import { RegistrarChamadaDto } from './dto/registrar-chamada.dto';
import { montarListaPresenca } from './lista-presenca';

export interface LinhaChamada {
  educandoId: number;
  nome: string;
  presente: boolean | null;
  observacao: string | null;
  // Tem presença gravada, mas não está mais vinculado à iniciativa.
  desvinculado: boolean;
}

// Presença por encontro (RF18) e histórico por educando (RF19).
@Injectable()
export class FrequenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async chamada(encontroId: number, organizacaoId: number) {
    const encontro = await garantirEncontro(this.prisma, encontroId, organizacaoId);
    const linhas = await this.linhasDaChamada(encontroId, encontro.atividade.projetoId, organizacaoId);
    return {
      encontro: {
        id: encontro.id,
        dataInicio: encontro.dataInicio,
        horaInicio: encontro.horaInicio,
        situacao: encontro.situacao,
        atividade: { id: encontro.atividade.id, nome: encontro.atividade.nome },
      },
      aceitaChamada: aceitaChamada(encontro),
      linhas,
    };
  }

  async registrar(encontroId: number, dados: RegistrarChamadaDto, organizacaoId: number) {
    const encontro = await garantirEncontro(this.prisma, encontroId, organizacaoId);
    if (!aceitaChamada(encontro)) {
      throw new BadRequestException('Encontro cancelado não recebe chamada.');
    }
    const permitidos = new Set(
      (await this.linhasDaChamada(encontroId, encontro.atividade.projetoId, organizacaoId)).map(
        (linha) => linha.educandoId,
      ),
    );
    const fora = dados.registros.filter((r) => !permitidos.has(r.educandoId));
    if (fora.length > 0) {
      throw new BadRequestException(
        'A chamada só aceita educandos ativos vinculados à iniciativa da atividade.',
      );
    }

    await this.prisma.$transaction(
      dados.registros.map((r) => {
        const valores = {
          presencaAusencia: r.presente ? PRESENCA : AUSENCIA,
          observacao: r.observacao?.trim() || null,
        };
        return this.prisma.frequencia.upsert({
          where: { encontroId_educandoId: { encontroId, educandoId: r.educandoId } },
          create: { encontroId, educandoId: r.educandoId, ...valores },
          update: valores,
        });
      }),
    );
    return this.chamada(encontroId, organizacaoId);
  }

  async historicoDoEducando(educandoId: number, organizacaoId: number) {
    const educando = await this.prisma.educando.findFirst({
      where: { id: educandoId, organizacaoId },
      select: { id: true },
    });
    if (!educando) throw new NotFoundException('Educando não encontrado.');
    return this.prisma.frequencia.findMany({
      where: { educandoId },
      include: {
        encontro: {
          select: {
            id: true,
            dataInicio: true,
            horaInicio: true,
            situacao: true,
            atividade: {
              select: { id: true, nome: true, projeto: { select: { id: true, nome: true } } },
            },
          },
        },
      },
      orderBy: { encontro: { dataInicio: 'desc' } },
    });
  }

  // Lista de presença da atividade no período: encontros não cancelados, em
  // ordem de data, e a grade educando × encontro.
  async listaDePresenca(
    atividadeId: number,
    inicio: string,
    fim: string,
    organizacaoId: number,
  ) {
    if (inicio > fim) {
      throw new BadRequestException('A data inicial não pode ser depois da data final.');
    }
    const atividade = await this.prisma.atividade.findFirst({
      where: { id: atividadeId, projeto: { is: { organizacaoId } } },
      select: {
        id: true,
        nome: true,
        projetoId: true,
        projeto: { select: { id: true, nome: true } },
      },
    });
    if (!atividade) throw new NotFoundException('Atividade não encontrada.');

    const { desde, ate } = intervaloDeDias(inicio, fim);
    const [encontros, vinculados] = await Promise.all([
      this.prisma.encontro.findMany({
        where: {
          atividadeId,
          situacao: { not: 'cancelado' },
          dataInicio: { gte: desde, lt: ate },
        },
        select: {
          id: true,
          dataInicio: true,
          horaInicio: true,
          situacao: true,
          frequencias: {
            select: {
              educandoId: true,
              presencaAusencia: true,
              educando: { select: { nome: true } },
            },
          },
        },
        orderBy: [{ dataInicio: 'asc' }, { horaInicio: 'asc' }],
      }),
      this.prisma.educando.findMany({
        where: {
          organizacaoId,
          situacaoAtual: 'ativo',
          educandoProjetos: {
            some: { projetoId: atividade.projetoId, situacao: SITUACAO_VINCULO_ATIVO },
          },
        },
        select: { id: true, nome: true },
      }),
    ]);

    return {
      atividade: { id: atividade.id, nome: atividade.nome, iniciativa: atividade.projeto },
      periodo: { inicio, fim },
      encontros: encontros.map(({ frequencias: _f, ...encontro }) => encontro),
      linhas: montarListaPresenca(encontros, vinculados),
    };
  }

  // Educandos ativos vinculados à iniciativa, mais quem já tem presença
  // gravada no encontro mesmo que tenha sido desvinculado depois.
  private async linhasDaChamada(
    encontroId: number,
    projetoId: number,
    organizacaoId: number,
  ): Promise<LinhaChamada[]> {
    const [vinculados, gravadas] = await Promise.all([
      this.prisma.educando.findMany({
        where: {
          organizacaoId,
          situacaoAtual: 'ativo',
          educandoProjetos: { some: { projetoId, situacao: SITUACAO_VINCULO_ATIVO } },
        },
        select: { id: true, nome: true },
      }),
      this.prisma.frequencia.findMany({
        where: { encontroId },
        select: {
          educandoId: true,
          presencaAusencia: true,
          observacao: true,
          educando: { select: { nome: true } },
        },
      }),
    ]);

    const porEducando = new Map(gravadas.map((f) => [f.educandoId, f]));
    const linhas: LinhaChamada[] = vinculados.map((e) => {
      const f = porEducando.get(e.id);
      return {
        educandoId: e.id,
        nome: e.nome,
        presente: f ? f.presencaAusencia === PRESENCA : null,
        observacao: f?.observacao ?? null,
        desvinculado: false,
      };
    });
    const idsVinculados = new Set(vinculados.map((e) => e.id));
    for (const f of gravadas) {
      if (idsVinculados.has(f.educandoId)) continue;
      linhas.push({
        educandoId: f.educandoId,
        nome: f.educando.nome,
        presente: f.presencaAusencia === PRESENCA,
        observacao: f.observacao,
        desvinculado: true,
      });
    }
    return linhas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }
}
