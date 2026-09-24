import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERFIS_KEY } from '../decorators/perfis.decorator';
import { Perfil } from '../perfis.constants';

@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfisExigidos = this.reflector.getAllAndOverride<Perfil[]>(
      PERFIS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!perfisExigidos || perfisExigidos.length === 0) {
      return true;
    }

    const { usuario } = context.switchToHttp().getRequest();

    if (!usuario || !perfisExigidos.includes(usuario.perfil)) {
      throw new ForbiddenException(
        'Perfil sem permissão para esta operação.',
      );
    }

    return true;
  }
}
