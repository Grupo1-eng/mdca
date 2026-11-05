import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PERFIS_FINANCEIRO, Perfil } from './perfis.constants';
import { RegistroAuditoriaService } from '../shared/auditorias/registro-auditoria.service';

// Não há cadastro público: usuários são criados pela coordenação em
// /api/usuarios (ver backend/README.md).

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

  // Formato da resposta do login.
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