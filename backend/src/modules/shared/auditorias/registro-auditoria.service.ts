import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { contextoAtual } from '../../../common/contexto/contexto-requisicao';
import { Alteracoes } from './diferencas';

export interface EventoAuditoria {
  acao: string;
  recursoTipo: string;
  recursoId?: string | number | null;
  resumo: string;
  alteracoes?: Alteracoes | null;
  modulo?: string;
  // Autor explícito, para eventos sem usuário no token (login, login_falhou).
  // Sem ele, o autor vem do contexto da requisição.
  autor?: { id?: number | null; perfil?: string | null; organizacaoId?: number | null };
}

@Injectable()
export class RegistroAuditoriaService {
  private readonly logger = new Logger(RegistroAuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Grava dentro da transação da operação auditada: se a auditoria falhar,
  // a operação inteira é desfeita.
  async registrar(tx: Prisma.TransactionClient, evento: EventoAuditoria) {
    await tx.auditoria.create({ data: this.montar(evento) });
  }

  // Para eventos sem operação a proteger (login_falhou, acesso_negado): uma
  // falha ao gravar não pode mudar a resposta ao usuário, só é logada.
  async registrarAvulso(evento: EventoAuditoria) {
    try {
      await this.prisma.auditoria.create({ data: this.montar(evento) });
    } catch (erro) {
      this.logger.error(`Falha ao gravar auditoria "${evento.acao}": ${(erro as Error).message}`);
    }
  }

  private montar(evento: EventoAuditoria): Prisma.AuditoriaUncheckedCreateInput {
    const contexto = contextoAtual();
    const autor = evento.autor ?? contexto?.usuario;
    const alteracoes =
      evento.alteracoes && Object.keys(evento.alteracoes).length > 0
        ? (evento.alteracoes as Prisma.InputJsonObject)
        : undefined;

    return {
      modulo: evento.modulo ?? 'financeiro',
      acao: evento.acao,
      recursoTipo: evento.recursoTipo,
      recursoId: evento.recursoId == null ? null : String(evento.recursoId),
      resumo: evento.resumo,
      alteracoes,
      usuarioId: autor?.id ?? null,
      perfil: autor?.perfil ?? null,
      organizacaoId: autor?.organizacaoId ?? null,
      ip: contexto?.ip ?? null,
      userAgent: contexto?.userAgent ?? null,
      requestId: contexto?.requestId ?? null,
    };
  }
}
