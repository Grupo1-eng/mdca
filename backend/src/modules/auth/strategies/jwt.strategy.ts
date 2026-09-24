import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsuarioAutenticado } from '../decorators/usuario-atual.decorator';
import { obterJwtSecret } from '../jwt-config';

export interface JwtPayload {
  sub: number;
  email: string;
  perfil: string;
  organizacaoId: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: obterJwtSecret(),
    });
  }

  // Consulta o banco a cada requisição: um token continua válido até expirar,
  // então sem isso um usuário inativado (ou com perfil alterado) manteria o
  // acesso antigo até o fim da sessão.
  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        organizacaoId: true,
        ativo: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Token ausente ou inválido.');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      organizacaoId: usuario.organizacaoId,
    };
  }
}
