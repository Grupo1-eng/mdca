import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Somente leitura: registros de auditoria são gerados pelo próprio backend,
// nunca enviados pelo cliente.
@Injectable()
export class AuditoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodas() {
    return this.prisma.auditoria.findMany();
  }

  async buscarPorId(id: number) {
    const auditoria = await this.prisma.auditoria.findUnique({
      where: { id },
    });
    if (!auditoria) {
      throw new NotFoundException('Registro de auditoria não encontrado');
    }
    return auditoria;
  }
}
