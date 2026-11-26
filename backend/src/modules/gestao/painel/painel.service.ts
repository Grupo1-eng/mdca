import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { Perfil } from '../../auth/perfis.constants';
import { intervaloDeDias } from '../atividades/regras-atividades';
import { PERFIS_VEEM_ORCAMENTO_INICIATIVA } from '../perfis-gestao';
import { calcularPainel, intervaloDoPeriodo } from './calculo-painel';
import { ConsultaPainelDto } from './dto/consulta-painel.dto';

const SITUACAO_REALIZADO = 'realizado';

@Injectable()
export class PainelService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(
    filtros: ConsultaPainelDto,
    organizacaoId: number,
    perfil: string,
  ) {
    const { inicio, fim, iniciativaId } = filtros;
    if (Number.isNaN(Date.parse(inicio)) || Number.isNaN(Date.parse(fim))) {
      throw new BadRequestException('Período inválido.');
    }
    if (inicio > fim) {
      throw new BadRequestException(
        'A data inicial não pode ser depois da data final.',
      );
    }
    // Evoluções guardam o instante do atendimento (calendário de Brasília);
    // encontros guardam só o dia, à meia-noite UTC (dataDoDia).
    const { desde, ate } = intervaloDoPeriodo(inicio, fim);
    const dias = intervaloDeDias(inicio, fim);
    const comOrcamento = PERFIS_VEEM_ORCAMENTO_INICIATIVA.includes(
      perfil as Perfil,
    );

    const iniciativas = await this.prisma.projeto.findMany({
      where: {
        organizacaoId,
        ...(iniciativaId !== undefined ? { id: iniciativaId } : {}),
      },
      select: {
        id: true,
        nome: true,
        tipo: true,
        ...(comOrcamento ? { orcamentoTotal: true } : {}),
      },
    });

    // Iniciativa de outra organização responde 404, como se não existisse.
    if (iniciativaId !== undefined && iniciativas.length === 0) {
      throw new NotFoundException('Iniciativa não encontrada.');
    }

    const [encontros, evolucoes] = await Promise.all([
      this.prisma.encontro.findMany({
        where: {
          situacao: SITUACAO_REALIZADO,
          dataInicio: { gte: dias.desde, lt: dias.ate },
          atividade: {
            projeto: { organizacaoId },
            ...(iniciativaId !== undefined ? { projetoId: iniciativaId } : {}),
          },
        },
        select: {
          atividade: { select: { projetoId: true } },
          frequencias: {
            select: { educandoId: true, presencaAusencia: true },
          },
        },
      }),
      this.prisma.evolucao.findMany({
        where: {
          dataInicio: { gte: desde, lt: ate },
          educando: { organizacaoId },
          ...(iniciativaId !== undefined
            ? {
                OR: [
                  { projetoId: iniciativaId },
                  {
                    projetoId: null,
                    educando: {
                      educandoProjetos: { some: { projetoId: iniciativaId } },
                    },
                  },
                ],
              }
            : {}),
        },
        select: {
          educandoId: true,
          projetoId: true,
          educando: {
            select: { educandoProjetos: { select: { projetoId: true } } },
          },
        },
      }),
    ]);

    return {
      filtros: { inicio, fim, iniciativaId: iniciativaId ?? null },
      ...calcularPainel(iniciativas, encontros, evolucoes, comOrcamento),
    };
  }
}
