import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateProjetoDto } from '../../shared/projetos/dto/create-projeto.dto';
import { UpdateProjetoDto } from '../../shared/projetos/dto/update-projeto.dto';

// Iniciativas (projetos, serviços e programas) da organização do usuário.
// Usa a tabela compartilhada `projeto` e os mesmos DTOs de /api/projetos,
// sem criar outro modelo. A auditoria usa os mesmos registros do projeto
// (recurso "projeto"), para o histórico aparecer também no Financeiro.
const CAMPOS = {
  id: true,
  nome: true,
  descricao: true,
  tipo: true,
  status: true,
  orcamentoTotal: true,
  dataInicio: true,
  dataFim: true,
} as const;

@Injectable()
export class IniciativasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listar(organizacaoId: number) {
    return this.prisma.projeto.findMany({
      where: { organizacaoId },
      select: CAMPOS,
      orderBy: { nome: 'asc' },
    });
  }

  async criar(dados: CreateProjetoDto, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const projeto = await tx.projeto.create({ data: { ...dados, organizacaoId } });
      await this.auditoria.criacao(tx, 'projeto', projeto);
      return projeto;
    });
  }

  // Projeto de outra organização responde 404, como se não existisse.
  async atualizar(id: number, dados: UpdateProjetoDto, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await tx.projeto.findFirst({ where: { id, organizacaoId } });
      if (!antes) throw new NotFoundException('Iniciativa não encontrada');
      const depois = await tx.projeto.update({ where: { id }, data: dados });
      await this.auditoria.atualizacao(tx, 'projeto', antes, depois);
      return depois;
    });
  }
}
