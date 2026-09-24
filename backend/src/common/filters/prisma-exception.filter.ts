import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Converte erros conhecidos do Prisma Client em respostas HTTP consistentes,
 * equivalentes ao que o Spring Boot devolvia via ResponseStatusException.
 *
 * - P2025: registro não encontrado (ex.: update/delete de um id inexistente
 *   numa condição de corrida) -> 404
 * - P2002: violação de restrição única -> 409
 * - P2003: violação de chave estrangeira -> 400
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2025':
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado',
        });
        return;
      case 'P2002':
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Já existe um registro com esses dados (violação de restrição única)',
          fields: exception.meta?.target,
        });
        return;
      case 'P2003':
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referência inválida: registro relacionado não existe',
        });
        return;
      default:
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro interno ao acessar o banco de dados',
        });
    }
  }
}
