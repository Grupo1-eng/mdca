import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERFIS_KEY } from '../decorators/perfis.decorator';
import { PERFIS_FINANCEIRO, Perfil } from '../perfis.constants';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';

@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const perfisExigidos = this.reflector.getAllAndOverride<Perfil[]>(
      PERFIS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!perfisExigidos || perfisExigidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { usuario } = request;

    if (!usuario || !perfisExigidos.includes(usuario.perfil)) {
      // Só rotas exclusivas do financeiro entram no log do financeiro.
      if (usuario && perfisExigidos.every((p) => PERFIS_FINANCEIRO.includes(p))) {
        // Padrão da rota (/api/lancamentos/:id), sem ids nem query string.
        const rota = `${request.method} ${request.baseUrl ?? ''}${request.route?.path ?? request.path}`;
        await this.auditoria.registrarAvulso({
          acao: 'acesso_negado',
          recursoTipo: 'rota',
          recursoId: rota,
          resumo: `Acesso negado a ${rota} (perfil ${usuario.perfil})`,
        });
      }
      throw new ForbiddenException(
        'Perfil sem permissão para esta operação.',
      );
    }

    return true;
  }
}
