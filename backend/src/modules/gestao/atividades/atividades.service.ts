import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { PERFIS_REGISTRO_ATIVIDADES } from '../perfis-gestao';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { garantirAtividade } from './regras-atividades';

const DETALHES = {
  projeto: { select: { id: true, nome: true, tipo: true } },
  responsavel: { select: { id: true, nome: true } },
  encontros: { select: { situacao: true } },
} as const;

export interface FiltroAtividades {
  projetoId?: number;
  situacao?: string;
}

// Atividades de uma iniciativa (RF17). Sem exclusão: a atividade é encerrada.
@Injectable()
export class AtividadesService {
  constructor(private readonly prisma: PrismaService) {}

  // Quem pode ser responsável: usuários ativos da organização que registram
  // atividades (coordenação e educador).
  listarResponsaveis(organizacaoId: number) {
    return this.prisma.usuario.findMany({
      where: { organizacaoId, ativo: true, perfil: { in: PERFIS_REGISTRO_ATIVIDADES } },
      select: { id: true, nome: true, perfil: true },
      orderBy: { nome: 'asc' },
    });
  }

  listar(organizacaoId: number, filtro: FiltroAtividades = {}) {
    return this.prisma.atividade.findMany({
      where: {
        projeto: { is: { organizacaoId } },
        ...(filtro.projetoId ? { projetoId: filtro.projetoId } : {}),
        ...(filtro.situacao ? { situacao: filtro.situacao } : {}),
      },
      include: DETALHES,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: number, organizacaoId: number) {
    await garantirAtividade(this.prisma, id, organizacaoId);
    return this.prisma.atividade.findUnique({ where: { id }, include: DETALHES });
  }

  async criar(dados: CreateAtividadeDto, organizacaoId: number) {
    await this.garantirIniciativa(dados.projetoId, organizacaoId);
    await this.garantirResponsavel(dados.responsavelId, organizacaoId);
    return this.prisma.atividade.create({
      data: {
        projetoId: dados.projetoId,
        responsavelId: dados.responsavelId,
        nome: dados.nome.trim(),
        descricao: dados.descricao?.trim() || null,
        situacao: dados.situacao ?? 'ativa',
      },
      include: DETALHES,
    });
  }

  async atualizar(id: number, dados: UpdateAtividadeDto, organizacaoId: number) {
    await garantirAtividade(this.prisma, id, organizacaoId);
    if (dados.projetoId !== undefined) await this.garantirIniciativa(dados.projetoId, organizacaoId);
    if (dados.responsavelId !== undefined) await this.garantirResponsavel(dados.responsavelId, organizacaoId);
    if (dados.nome !== undefined && !dados.nome.trim()) {
      throw new BadRequestException('O nome da atividade é obrigatório.');
    }
    return this.prisma.atividade.update({
      where: { id },
      data: {
        ...(dados.projetoId !== undefined ? { projetoId: dados.projetoId } : {}),
        ...(dados.responsavelId !== undefined ? { responsavelId: dados.responsavelId } : {}),
        ...(dados.nome !== undefined ? { nome: dados.nome.trim() } : {}),
        ...(dados.descricao !== undefined ? { descricao: dados.descricao?.trim() || null } : {}),
        ...(dados.situacao !== undefined ? { situacao: dados.situacao } : {}),
      },
      include: DETALHES,
    });
  }

  private async garantirIniciativa(projetoId: number, organizacaoId: number) {
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, organizacaoId },
      select: { id: true },
    });
    if (!projeto) throw new NotFoundException('Iniciativa não encontrada.');
  }

  private async garantirResponsavel(usuarioId: number, organizacaoId: number) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, organizacaoId, ativo: true, perfil: { in: PERFIS_REGISTRO_ATIVIDADES } },
      select: { id: true },
    });
    if (!usuario) {
      throw new BadRequestException(
        'O responsável deve ser um usuário ativo da organização, da coordenação ou educador.',
      );
    }
  }
}
