import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PERFIS } from './perfis.constants';

// Mesmo custo usado em UsuariosService, para os hashes serem consistentes.
const BCRYPT_ROUNDS = 10;

// Perfil atribuído a quem se cadastra pelo endpoint público.
// Perfis de maior privilégio só podem ser concedidos pela coordenação
// via PUT /api/usuarios/:id.
const PERFIL_PADRAO_REGISTRO = PERFIS.ADMINISTRATIVO;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dados: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        email: dados.email,
        ativo: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const senhaConfere = await bcrypt.compare(
      dados.senha,
      usuario.senhaHash,
    );

    if (!senhaConfere) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return this.gerarSessao(usuario);
  }

  async register(dados: RegisterDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dados.email },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const senhaHash = await bcrypt.hash(dados.senha, BCRYPT_ROUNDS);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senhaHash,
          perfil: PERFIL_PADRAO_REGISTRO,
          organizacaoId: dados.organizacaoId,
        },
      });

      return this.gerarSessao(usuario);
    } catch (erro) {
      // Corrida: dois cadastros simultâneos com o mesmo e-mail passam pelo
      // findUnique acima, e o índice único do banco barra o segundo.
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }
      throw erro;
    }
  }

  // Formato único de resposta para login e register.
  private async gerarSessao(usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
    organizacaoId: number;
  }) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      organizacaoId: usuario.organizacaoId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }
}