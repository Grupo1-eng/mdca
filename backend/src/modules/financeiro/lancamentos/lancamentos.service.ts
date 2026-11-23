import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Lancamento, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistroAuditoriaService } from '../../shared/auditorias/registro-auditoria.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { limitesDoMes, resumoSemanalDoMes } from './resumo-semanal';
import { ExtratoQueryDto } from './dto/extrato-query.dto';
import { SEM_PROJETO } from './dto/resumo-semanal-query.dto';
import { dataDeTexto, montarDadosDoExtrato, nomeDoArquivo, rotuloDoPeriodo } from './extrato';
import { gerarPlanilhaDoExtrato } from './extrato-xlsx';
import { ajustarSaldo, efeitoNoSaldo } from './saldo-conta';
import { SITUACOES_POR_TIPO, situacaoCompativel } from './regras-lancamento';

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

  async exportarExtrato(
    filtros: ExtratoQueryDto,
    organizacaoId: number,
    nomeUsuario: string | null,
    agora = new Date(),
  ) {
    const de = lerData('de', filtros.de);
    const ate = lerData('ate', filtros.ate);
    if (de && ate && de > ate) {
      throw new BadRequestException('A data inicial não pode ser posterior à data final');
    }
    const projetoId =
      filtros.projetoId === undefined
        ? undefined
        : filtros.projetoId === SEM_PROJETO
          ? null
          : Number(filtros.projetoId);
    const categoriaId = filtros.categoriaId === undefined ? undefined : Number(filtros.categoriaId);
    const busca = filtros.busca?.trim() || undefined;

    const projeto =
      typeof projetoId === 'number'
        ? await this.prisma.projeto.findFirst({
            where: { id: projetoId, organizacaoId },
            select: { nome: true },
          })
        : null;
    if (typeof projetoId === 'number' && !projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }
    const categoria =
      categoriaId !== undefined
        ? await this.prisma.categoriaFinanceira.findUnique({
            where: { id: categoriaId },
            select: { nome: true },
          })
        : null;
    if (categoriaId !== undefined && !categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const intervalo = {
      ...(de && { gte: de }),
      ...(ate && { lt: new Date(ate.getTime() + DIA_EM_MS) }),
    };
    const condicoes: Prisma.LancamentoWhereInput[] = [];
    if (de || ate) {
      condicoes.push({
        OR: [
          { dataCompetencia: intervalo },
          { dataCompetencia: null, dataPagamento: intervalo },
          { dataCompetencia: null, dataPagamento: null, criadoEm: intervalo },
        ],
      });
    }
    if (busca) {
      condicoes.push({
        OR: [
          { descricao: { contains: busca, mode: 'insensitive' } },
          { projeto: { nome: { contains: busca, mode: 'insensitive' } } },
        ],
      });
    }

    const lancamentos = await this.prisma.lancamento.findMany({
      where: {
        conta: { organizacaoId },
        ...(projetoId !== undefined && { projetoId }),
        ...(categoriaId !== undefined && {
          categoria: { OR: [{ id: categoriaId }, { categoriaPaiId: categoriaId }] },
        }),
        ...(filtros.tipo && { tipo: filtros.tipo }),
        ...(condicoes.length > 0 && { AND: condicoes }),
      },
      include: {
        conta: { select: { nome: true } },
        categoria: { select: { nome: true } },
        projeto: { select: { nome: true } },
      },
    });

    const dados = montarDadosDoExtrato(
      lancamentos,
      {
        periodo: rotuloDoPeriodo(de ?? undefined, ate ?? undefined),
        projeto:
          projetoId === undefined ? 'Todos' : projetoId === null ? 'Sem projeto' : (projeto?.nome ?? ''),
        categoria: categoria?.nome ?? 'Todas',
        tipo: filtros.tipo === 'entrada' ? 'Entradas' : filtros.tipo === 'saida' ? 'Saídas' : 'Todos',
        busca,
      },
      nomeUsuario,
      agora,
    );

    return { arquivo: await gerarPlanilhaDoExtrato(dados), nome: nomeDoArquivo(agora) };
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
    validarSituacao(dados.tipo, dados.situacao ?? 'pendente');
    return this.prisma.$transaction(async (tx) => {
      await this.validarVinculos(dados, organizacaoId, tx, true);
      const lancamento = await tx.lancamento.create({ data: { ...dados, usuarioId } });
      await ajustarSaldo(tx, lancamento.contaId, efeitoNoSaldo(lancamento));
      await this.auditoria.criacao(tx, 'lancamento', lancamento);
      return lancamento;
    });
  }

  async atualizar(id: number, dados: UpdateLancamentoDto, organizacaoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const antes = await this.buscarPorId(id, organizacaoId, tx);
      // Compara com o que já está gravado: mudar só o tipo ou só a situação
      // também precisa resultar numa combinação válida.
      validarSituacao(dados.tipo ?? antes.tipo, dados.situacao ?? antes.situacao);
      // Conta inativa mantém os lançamentos que já tinha (RNF10): só recusa
      // quando o lançamento é movido para ela.
      const trocouDeConta = dados.contaId !== undefined && dados.contaId !== antes.contaId;
      await this.validarVinculos(dados, organizacaoId, tx, trocouDeConta);
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

  /** `exigirContaAtiva`: conta inativa não recebe lançamento novo (RNF10, RF16). */
  private async validarVinculos(
    dados: { contaId?: number; projetoId?: number },
    organizacaoId: number,
    db: Prisma.TransactionClient,
    exigirContaAtiva: boolean,
  ) {
    if (dados.contaId !== undefined) {
      const conta = await db.contaFinanceira.findFirst({
        where: { id: dados.contaId, organizacaoId },
      });
      if (!conta) {
        throw new NotFoundException('Conta financeira não encontrada');
      }
      if (exigirContaAtiva && !conta.ativa) {
        throw new BadRequestException('Conta financeira inativa não aceita novos lançamentos.');
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

function validarSituacao(tipo: string, situacao: string) {
  if (!situacaoCompativel(tipo, situacao)) {
    const validas = (SITUACOES_POR_TIPO[tipo] ?? []).join(' ou ');
    throw new BadRequestException(`Situação "${situacao}" não vale para ${tipo}: use ${validas}.`);
  }
}

const DIA_EM_MS = 24 * 60 * 60 * 1000;

function lerData(campo: string, texto?: string): Date | null {
  if (texto === undefined) return null;
  const data = dataDeTexto(texto);
  if (!data) throw new BadRequestException(`${campo} não é uma data válida`);
  return data;
}
