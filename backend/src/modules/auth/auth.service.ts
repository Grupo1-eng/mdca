import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PERFIS_FINANCEIRO, Perfil } from './perfis.constants';
import { RegistroAuditoriaService } from '../shared/auditorias/registro-auditoria.service';
import { UsuarioAutenticado } from './decorators/usuario-atual.decorator';

interface DadosSessao {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  organizacaoId: number;
}

interface OrganizacaoDaSessao {
  id: number;
  nome: string;
}

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
      include: { organizacao: { select: { id: true, nome: true } } },
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
    return this.gerarSessao(usuario, usuario.organizacao);
  }

  // Dados do usuário logado (GET /api/auth/me), no mesmo formato do `usuario`
  // do login. A organização vai junto para o frontend mostrar o nome dela, por
  // exemplo no cabeçalho dos relatórios em PDF.
  async usuarioAtual(usuario: UsuarioAutenticado) {
    const organizacao = await this.prisma.organizacao.findUnique({
      where: { id: usuario.organizacaoId },
      select: { id: true, nome: true },
    });
    return this.dadosDoUsuario(usuario, organizacao);
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
  private async gerarSessao(
    usuario: DadosSessao,
    organizacao: OrganizacaoDaSessao | null,
  ) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      organizacaoId: usuario.organizacaoId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: this.dadosDoUsuario(usuario, organizacao),
    };
  }

  private dadosDoUsuario(
    usuario: DadosSessao,
    organizacao: OrganizacaoDaSessao | null,
  ) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      organizacao: organizacao
        ? { id: organizacao.id, nome: organizacao.nome }
        : null,
    };
  }
}