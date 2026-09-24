import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateResponsavelFamiliarDto } from './dto/create-responsavel-familiar.dto';
import { UpdateResponsavelFamiliarDto } from './dto/update-responsavel-familiar.dto';

@Injectable()
export class ResponsaveisFamiliaresService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.responsavelFamiliar.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(id: number) {
    const responsavel =
      await this.prisma.responsavelFamiliar.findUnique({
        where: { id },
      });

    if (!responsavel) {
      throw new NotFoundException(
        'Responsável familiar não encontrado',
      );
    }

    return responsavel;
  }

  async criar(dados: CreateResponsavelFamiliarDto) {
    return this.prisma.responsavelFamiliar.create({
      data: dados,
    });
  }

  async atualizar(
    id: number,
    dados: UpdateResponsavelFamiliarDto,
  ) {
    await this.buscarPorId(id);

    return this.prisma.responsavelFamiliar.update({
      where: { id },
      data: dados,
    });
  }
}
