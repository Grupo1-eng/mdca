import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';

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

  async criar(dados: CreateAuditoriaDto, usuarioId: number) {
    return this.prisma.auditoria.create({
      data: { ...dados, usuarioId },
    });
  }

  async deletar(id: number) {
    await this.buscarPorId(id);
    await this.prisma.auditoria.delete({ where: { id } });
  }
}
