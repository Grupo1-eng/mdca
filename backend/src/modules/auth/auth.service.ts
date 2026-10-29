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
import { PERFIS, PERFIS_FINANCEIRO, Perfil } from './perfis.constants';
import { RegistroAuditoriaService } from '../shared/auditorias/registro-auditoria.service';
import { diferencas } from '../shared/auditorias/diferencas';

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
    private readonly auditoria: RegistroAuditoriaService,
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
      await this.auditarLogin(usuario, 'login_falhou', 'Login falhou: senha incorreta');
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    await this.auditarLogin(usuario, 'login', 'Login realizado');
    return this.gerarSessao(usuario);
  }

  // Só usuários com acesso ao financeiro entram no log do financeiro. E-mails
  // inexistentes não são registrados: não têm organização e guardariam o que
  // foi digitado.
  private async auditarLogin(
    usuario: { id: number; nome: string; perfil: string; organizacaoId: number },
    acao: 'login' | 'login_falhou',
    resumo: string,
  ) {
    if (!PERFIS_FINANCEIRO.includes(usuario.perfil as Perfil)) return;
    await this.auditoria.registrarAvulso({
      acao,
      recursoTipo: 'usuario',
      recursoId: usuario.id,
      resumo: `${resumo} (${usuario.nome})`,
      autor: usuario,
    });
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
      // O perfil padrão dá acesso ao financeiro: o cadastro público é auditado,
      // tendo o próprio usuário como autor.
      const usuario = await this.prisma.$transaction(async (tx) => {
        const criado = await tx.usuario.create({
          data: {
            nome: dados.nome,
            email: dados.email,
            senhaHash,
            perfil: PERFIL_PADRAO_REGISTRO,
            organizacaoId: dados.organizacaoId,
          },
        });
        await this.auditoria.registrar(tx, {
          acao: 'criar',
          recursoTipo: 'usuario',
          recursoId: criado.id,
          resumo: `Usuário #${criado.id} (${criado.nome}) cadastrou-se pelo registro público`,
          alteracoes: diferencas(null, criado),
          autor: criado,
        });
        return criado;
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