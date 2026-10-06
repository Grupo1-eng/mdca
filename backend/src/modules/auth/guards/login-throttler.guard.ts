import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limit por IP + e-mail (em vez de só IP).
 *
 * - Um atacante tentando muitas senhas contra UMA conta é barrado mesmo
 *   trocando de IP? Não: o contador é por par (IP, e-mail). Para barrar
 *   também esse caso, veja a nota no final do arquivo.
 * - Em contrapartida, vários usuários atrás do mesmo IP (ex.: a rede da
 *   ONG) não bloqueiam uns aos outros, pois cada e-mail tem o próprio contador.
 *
 * Guards rodam ANTES do ValidationPipe, então o e-mail ainda não foi
 * normalizado: repetimos aqui o mesmo trim + lowercase do @NormalizarEmail,
 * senão "Maria@x" e "maria@x" teriam contadores separados.
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip: string = req.ip ?? req.socket?.remoteAddress ?? 'ip-desconhecido';
    const email = req.body?.email;

    if (typeof email !== 'string' || email.trim() === '') {
      // Sem e-mail válido no body, cai no limite só por IP.
      return ip;
    }

    return `${ip}|${email.trim().toLowerCase()}`;
  }
}