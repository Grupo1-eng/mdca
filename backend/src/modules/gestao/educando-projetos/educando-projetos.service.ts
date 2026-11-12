import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEducandoProjetoDto } from './dto/create-educando-projeto.dto';
import { UpdateEducandoProjetoDto } from './dto/update-educando-projeto.dto';

export const SITUACAO_VINCULO_ATIVO = 'ativo';
export const SITUACAO_VINCULO_ENCERRADO = 'encerrado';

const COM_PROJETO = {
  projeto: { select: { id: true, nome: true, tipo: true } },
} as const;

// Vínculo do educando com uma iniciativa (RF21). Educando e iniciativa
// precisam ser da organização do usuário. Nada é apagado: o vínculo é
// encerrado e fica no histórico.
@Injectable()
export class EducandoProjetosService {
  constructor(private readonly prisma: PrismaService) {}

  private async garantirEducando(educandoId: number, organizacaoId: number) {
    const educando = await this.prisma.educando.findFirst({
      where: { id: educandoId, organizacaoId },
      select: { id: true },
    });
    if (!educando) throw new NotFoundException('Educando não encontrado.');
  }

  private async garantirIniciativa(projetoId: number, organizacaoId: number) {
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, organizacaoId },
      select: { id: true },
    });
    if (!projeto) throw new NotFoundException('Iniciativa não encontrada.');
  }

  async buscarPorId(id: number, organizacaoId: number) {
    const vinculo = await this.prisma.educandoProjeto.findFirst({
      where: { id, educando: { is: { organizacaoId } } },
      include: COM_PROJETO,
    });
    if (!vinculo) throw new NotFoundException('Vínculo não encontrado.');
    return vinculo;
  }

  // Ativos primeiro, depois os mais recentes.
  async listarPorEducando(educandoId: number, organizacaoId: number) {
    await this.garantirEducando(educandoId, organizacaoId);
    return this.prisma.educandoProjeto.findMany({
      where: { educandoId },
      include: COM_PROJETO,
      orderBy: [{ situacao: 'asc' }, { dataIngresso: 'desc' }],
    });
  }

  async criar(dados: CreateEducandoProjetoDto, organizacaoId: number) {
    await this.garantirEducando(dados.educandoId, organizacaoId);
    await this.garantirIniciativa(dados.projetoId, organizacaoId);

    const ativo = await this.prisma.educandoProjeto.findFirst({
      where: {
        educandoId: dados.educandoId,
        projetoId: dados.projetoId,
        situacao: SITUACAO_VINCULO_ATIVO,
      },
      select: { id: true },
    });
    if (ativo) {
      throw new ConflictException(
        'O educando já tem vínculo ativo com esta iniciativa.',
      );
    }

    return this.prisma.educandoProjeto.create({
      data: {
        educandoId: dados.educandoId,
        projetoId: dados.projetoId,
        ...(dados.dataIngresso ? { dataIngresso: dados.dataIngresso } : {}),
        situacao: SITUACAO_VINCULO_ATIVO,
      },
      include: COM_PROJETO,
    });
  }

  async atualizar(
    id: number,
    dados: UpdateEducandoProjetoDto,
    organizacaoId: number,
  ) {
    await this.buscarPorId(id, organizacaoId);
    return this.prisma.educandoProjeto.update({
      where: { id },
      data: { dataIngresso: dados.dataIngresso },
      include: COM_PROJETO,
    });
  }

  async encerrar(id: number, organizacaoId: number) {
    const vinculo = await this.buscarPorId(id, organizacaoId);
    if (vinculo.situacao === SITUACAO_VINCULO_ENCERRADO) return vinculo;
    return this.prisma.educandoProjeto.update({
      where: { id },
      data: { situacao: SITUACAO_VINCULO_ENCERRADO },
      include: COM_PROJETO,
    });
  }
}
