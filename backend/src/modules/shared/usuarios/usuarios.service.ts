import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsuarioAutenticado } from '../../auth/decorators/usuario-atual.decorator';
import { PERFIS_FINANCEIRO, Perfil } from '../../auth/perfis.constants';
import { RegistroAuditoriaService } from '../auditorias/registro-auditoria.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const usuarioSelect = {
  id: true,
  organizacaoId: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  criadoEm: true,
} as const;

// O log do financeiro registra o que muda o acesso a ele: usuários que têm ou
// passam a ter um perfil financeiro.
function envolveFinanceiro(...perfis: (string | undefined)[]) {
  return perfis.some((p) => p !== undefined && PERFIS_FINANCEIRO.includes(p as Perfil));
}

// Todas as operações ficam restritas à organização de quem está autenticado.
@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodos(organizacaoId: number) {
    return this.prisma.usuario.findMany({
      where: { organizacaoId },
      select: usuarioSelect,
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(
    id: number,
    organizacaoId: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const usuario = await db.usuario.findFirst({
      where: { id, organizacaoId },
      select: usuarioSelect,
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async criar(dados: CreateUsuarioDto, organizacaoId: number) {
    const {
      senha,
      ...dadosUsuario
    } = dados;

    const senhaHash = await bcrypt.hash(senha, 10);

    const data: Prisma.UsuarioUncheckedCreateInput = {
      ...dadosUsuario,
      organizacaoId,
      senhaHash,
    };

    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data,
        select: usuarioSelect,
      });
      if (envolveFinanceiro(usuario.perfil)) {
        await this.auditoria.criacao(tx, 'usuario', usuario);
      }
      return usuario;
    });
  }

  async atualizar(
    id: number,
    dados: UpdateUsuarioDto,
    autor: UsuarioAutenticado,
  ) {
    const antes = await this.buscarPorId(id, autor.organizacaoId);

    // Impede que a coordenação se tranque para fora: sem isso, a única conta
    // de coordenação poderia se rebaixar ou se desativar e ninguém mais
    // conseguiria gerenciar usuários.
    if (id === autor.id) {
      if (dados.perfil !== undefined && dados.perfil !== autor.perfil) {
        throw new BadRequestException('Você não pode alterar o próprio perfil.');
      }
      if (dados.ativo === false) {
        throw new BadRequestException('Você não pode inativar a própria conta.');
      }
    }

    const {
      senha,
      ...dadosUsuario
    } = dados;

    const data: Prisma.UsuarioUncheckedUpdateInput = {
      ...dadosUsuario,
    };

    if (senha) {
      data.senhaHash = await bcrypt.hash(senha, 10);
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.usuario.update({
        where: { id },
        data,
        select: usuarioSelect,
      });
      if (envolveFinanceiro(antes.perfil, depois.perfil)) {
        await this.auditoria.atualizacao(
          tx,
          'usuario',
          antes,
          depois,
          senha ? { senha: { alterado: true } } : {},
        );
      }
      return depois;
    });
  }

  async inativar(id: number, autor: UsuarioAutenticado) {
    const antes = await this.buscarPorId(id, autor.organizacaoId);

    if (id === autor.id) {
      throw new BadRequestException('Você não pode inativar a própria conta.');
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.usuario.update({
        where: { id },
        data: {
          ativo: false,
        },
        select: usuarioSelect,
      });
      if (envolveFinanceiro(depois.perfil)) {
        await this.auditoria.atualizacao(tx, 'usuario', antes, depois);
      }
      return depois;
    });
  }
}
