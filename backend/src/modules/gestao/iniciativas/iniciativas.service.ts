import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

// Iniciativas (projetos, serviços e programas) da organização do usuário.
// Lê a tabela compartilhada `projeto`, sem criar outro modelo; o cadastro
// continua na rota /api/projetos.
@Injectable()
export class IniciativasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(organizacaoId: number) {
    return this.prisma.projeto.findMany({
      where: { organizacaoId },
      select: {
        id: true,
        nome: true,
        descricao: true,
        tipo: true,
        status: true,
        dataInicio: true,
        dataFim: true,
      },
      orderBy: { nome: 'asc' },
    });
  }
}
