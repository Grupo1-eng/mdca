import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { contextoAtual } from '../../../common/contexto/contexto-requisicao';
import { Alteracoes, diferencas } from './diferencas';
import { RecursoAuditado, acaoDeAtualizacao, resumoAuditoria } from './recursos-auditoria';

type Registro = { id: number } & Record<string, unknown>;

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

  async criacao(tx: Prisma.TransactionClient, recursoTipo: RecursoAuditado, criado: Registro) {
    await this.alteracao(tx, recursoTipo, 'criar', criado, diferencas(null, criado));
  }

  // Sem nenhum campo alterado não há o que auditar.
  async atualizacao(
    tx: Prisma.TransactionClient,
    recursoTipo: RecursoAuditado,
    antes: Registro,
    depois: Registro,
    // Alterações que não aparecem no registro lido do banco (ex.: senha redefinida).
    extras: Alteracoes = {},
  ) {
    const alteracoes = { ...diferencas(antes, depois), ...extras };
    if (Object.keys(alteracoes).length === 0) return;
    await this.alteracao(tx, recursoTipo, acaoDeAtualizacao(alteracoes), depois, alteracoes);
  }

  async exclusao(tx: Prisma.TransactionClient, recursoTipo: RecursoAuditado, excluido: Registro) {
    await this.alteracao(tx, recursoTipo, 'excluir', excluido, diferencas(excluido, null));
  }

  private async alteracao(
    tx: Prisma.TransactionClient,
    recursoTipo: RecursoAuditado,
    acao: string,
    registro: Registro,
    alteracoes: Alteracoes,
  ) {
    await this.registrar(tx, {
      acao,
      recursoTipo,
      recursoId: registro.id,
      resumo: resumoAuditoria(recursoTipo, acao, registro, alteracoes),
      alteracoes,
    });
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
