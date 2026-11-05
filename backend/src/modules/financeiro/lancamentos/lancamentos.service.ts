import { Injectable, NotFoundException } from '@nestjs/common';
import { Lancamento, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { limitesDoMes, resumoSemanalDoMes } from './resumo-semanal';
import { ajustarSaldo, efeitoNoSaldo } from './saldo-conta';

// Lançamento não tem organizacao_id: pertence à organização da sua conta.
// Toda consulta filtra por `conta.organizacaoId` do token, e conta/projeto
// informados no corpo precisam ser da mesma organização. Registro de outra
// organização responde 404, como se não existisse.
// Toda alteração grava a auditoria na mesma transação: se o log falhar,
// a alteração é desfeita.
@Injectable()
export class LancamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: RegistroAuditoriaService,
  ) {}

  async listarTodos(organizacaoId: number) {
    return this.prisma.lancamento.findMany({
      where: { conta: { organizacaoId } },
    });
  }

  /**
   * `projetoId`: sem valor traz todos os lançamentos; `null`, só os sem projeto.
   * Projeto de outra organização não vaza nada: o filtro por organização vem da conta.
   */
  async resumoSemanal(mes: string, organizacaoId: number, projetoId?: number | null) {
    const { inicio, fimExclusivo } = limitesDoMes(mes);
    const intervalo = { gte: inicio, lt: fimExclusivo };

    const lancamentos = await this.prisma.lancamento.findMany({
      where: {
        conta: { organizacaoId },
        ...(projetoId !== undefined && { projetoId }),
        OR: [
          { dataCompetencia: intervalo },
          { dataCompetencia: null, dataPagamento: intervalo },
          { dataCompetencia: null, dataPagamento: null, criadoEm: intervalo },
        ],
      },
      select: {
        tipo: true,
        valor: true,
        dataCompetencia: true,
        dataPagamento: true,
        criadoEm: true,
      },
    });

    return resumoSemanalDoMes(mes, lancamentos);
  }

  async buscarPorId(
    id: number,
    organizacaoId: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const lancamento = await db.lancamento.findFirst({
      where: { id, conta: { organizacaoId } },
    });
    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    return lancamento;
  }

  async criar(dados: CreateLancamentoDto, usuarioId: number, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.validarVinculos(dados, organizacaoId, tx);
      const lancamento = await tx.lancamento.create({ data: { ...dados, usuarioId } });
      await ajustarSaldo(tx, lancamento.contaId, efeitoNoSaldo(lancamento));
      await this.auditoria.criacao(tx, 'lancamento', lancamento);
      return lancamento;
    });
  }

  async atualizar(id: number, dados: UpdateLancamentoDto, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, organizacaoId, tx);
      await this.validarVinculos(dados, organizacaoId, tx);
      const depois = await tx.lancamento.update({ where: { id }, data: dados });
      await this.reajustarSaldo(tx, antes, depois);
      await this.auditoria.atualizacao(tx, 'lancamento', antes, depois);
      return depois;
    });
  }

  async deletar(id: number, organizacaoId: number) {
    await this.prisma.$transaction(async (tx) => {
      const lancamento = await this.buscarPorId(id, organizacaoId, tx);
      await tx.lancamento.delete({ where: { id } });
      await ajustarSaldo(tx, lancamento.contaId, efeitoNoSaldo(lancamento).negated());
      await this.auditoria.exclusao(tx, 'lancamento', lancamento);
    });
  }

  /**
   * Desfaz o efeito do lançamento antigo e aplica o do novo. Na mesma conta,
   * grava só a diferença; trocando de conta, devolve à antiga e aplica na nova.
   */
  private async reajustarSaldo(
    tx: Prisma.TransactionClient,
    antes: Lancamento,
    depois: Lancamento,
  ) {
    if (antes.contaId === depois.contaId) {
      await ajustarSaldo(tx, depois.contaId, efeitoNoSaldo(depois).minus(efeitoNoSaldo(antes)));
      return;
    }
    await ajustarSaldo(tx, antes.contaId, efeitoNoSaldo(antes).negated());
    await ajustarSaldo(tx, depois.contaId, efeitoNoSaldo(depois));
  }

  private async validarVinculos(
    dados: { contaId?: number; projetoId?: number },
    organizacaoId: number,
    db: Prisma.TransactionClient,
  ) {
    if (dados.contaId !== undefined) {
      const conta = await db.contaFinanceira.findFirst({
        where: { id: dados.contaId, organizacaoId },
      });
      if (!conta) {
        throw new NotFoundException('Conta financeira não encontrada');
      }
    }
    if (dados.projetoId !== undefined && dados.projetoId !== null) {
      const projeto = await db.projeto.findFirst({
        where: { id: dados.projetoId, organizacaoId },
      });
      if (!projeto) {
        throw new NotFoundException('Projeto não encontrado');
      }
    }
  }
}
