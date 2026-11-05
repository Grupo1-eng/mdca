import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsuarioAutenticado } from '../../modules/auth/decorators/usuario-atual.decorator';

// Quem fez a requisição e de onde, disponível em qualquer ponto do código
// (ex.: AuditoriaService) sem passar o req de camada em camada.
export interface ContextoRequisicao {
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  // Undefined em rotas públicas ou antes do JwtAuthGuard.
  usuario: UsuarioAutenticado | undefined;
}

const LIMITE_USER_AGENT = 500;

const armazenamento = new AsyncLocalStorage<{ requestId: string; req: Request }>();

export function contextoAtual(): ContextoRequisicao | undefined {
  const store = armazenamento.getStore();
  if (!store) return undefined;
  const { req, requestId } = store;
  return {
    requestId,
    ip: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.get('user-agent')?.slice(0, LIMITE_USER_AGENT) ?? null,
    // Lido na hora do uso: o middleware roda antes do JwtAuthGuard preencher req.usuario.
    usuario: (req as Request & { usuario?: UsuarioAutenticado }).usuario,
  };
}

@Injectable()
export class ContextoRequisicaoMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Gerado sempre no servidor: um id vindo do cliente poderia ser forjado
    // para misturar eventos de requisições diferentes.
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    armazenamento.run({ requestId, req }, () => next());
  }
}
