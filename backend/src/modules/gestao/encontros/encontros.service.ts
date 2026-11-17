import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  aceitaEncontroNovo,
  dataDoDia,
  garantirAtividade,
  garantirEncontro,
} from '../atividades/regras-atividades';
import { CreateEncontroDto } from './dto/create-encontro.dto';
import { UpdateEncontroDto } from './dto/update-encontro.dto';

const COM_CONTAGEM = { _count: { select: { frequencias: true } } } as const;

const texto = (valor: string | null | undefined) => valor?.trim() || null;

// Encontros de uma atividade (RF17). Cancelar não apaga: muda a situação, e
// o cancelado não conta como realizado (RN05). Sem exclusão.
@Injectable()
export class EncontrosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorAtividade(atividadeId: number, organizacaoId: number) {
    await garantirAtividade(this.prisma, atividadeId, organizacaoId);
    return this.prisma.encontro.findMany({
      where: { atividadeId },
      include: COM_CONTAGEM,
      orderBy: [{ dataInicio: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async buscarPorId(id: number, organizacaoId: number) {
    await garantirEncontro(this.prisma, id, organizacaoId);
    return this.prisma.encontro.findUnique({ where: { id }, include: COM_CONTAGEM });
  }

  async criar(dados: CreateEncontroDto, organizacaoId: number) {
    const atividade = await garantirAtividade(this.prisma, dados.atividadeId, organizacaoId);
    if (!aceitaEncontroNovo(atividade)) {
      throw new BadRequestException(
        'Atividade encerrada não aceita encontros novos. Reabra a atividade para agendar.',
      );
    }
    return this.prisma.encontro.create({
      data: {
        atividadeId: dados.atividadeId,
        dataInicio: dataDoDia(dados.data),
        horaInicio: texto(dados.horaInicio),
        horaFim: texto(dados.horaFim),
        local: texto(dados.local),
        observacoes: texto(dados.observacoes),
        situacao: dados.situacao ?? 'agendado',
      },
      include: COM_CONTAGEM,
    });
  }

  async atualizar(id: number, dados: UpdateEncontroDto, organizacaoId: number) {
    await garantirEncontro(this.prisma, id, organizacaoId);
    return this.prisma.encontro.update({
      where: { id },
      data: {
        ...(dados.data !== undefined ? { dataInicio: dataDoDia(dados.data) } : {}),
        ...(dados.horaInicio !== undefined ? { horaInicio: texto(dados.horaInicio) } : {}),
        ...(dados.horaFim !== undefined ? { horaFim: texto(dados.horaFim) } : {}),
        ...(dados.local !== undefined ? { local: texto(dados.local) } : {}),
        ...(dados.observacoes !== undefined ? { observacoes: texto(dados.observacoes) } : {}),
        ...(dados.situacao !== undefined ? { situacao: dados.situacao } : {}),
      },
      include: COM_CONTAGEM,
    });
  }
}
