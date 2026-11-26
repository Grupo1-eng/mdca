// Regras e verificações de acesso compartilhadas por atividades, encontros e
// frequências. A organização vem sempre pela iniciativa:
// atividade → projeto → organizacaoId. Registro de outra organização
// responde 404, como se não existisse.
import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

export const SITUACOES_ATIVIDADE = ['ativa', 'encerrada'] as const;
export type SituacaoAtividade = (typeof SITUACOES_ATIVIDADE)[number];

// No banco "agendado" é o padrão do schema; na tela aparece como Planejado.
export const SITUACOES_ENCONTRO = ['agendado', 'realizado', 'cancelado'] as const;
export type SituacaoEncontro = (typeof SITUACOES_ENCONTRO)[number];

export const PRESENCA = 'presente';
export const AUSENCIA = 'ausente';

export const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Decisão 3 (2026-11-17): atividade encerrada não aceita encontros novos,
// mas pode voltar para ativa.
export function aceitaEncontroNovo(atividade: { situacao: string }): boolean {
  return atividade.situacao !== 'encerrada';
}

// Decisão 1 (EM ABERTO): quando a chamada pode ser registrada. Por ora vale a
// opção recomendada: em qualquer encontro não cancelado, sem mudar a situação
// dele. Para trocar a regra, altere só esta função.
export function aceitaChamada(encontro: { situacao: string }): boolean {
  return encontro.situacao !== 'cancelado';
}

// Data só como dia: guarda meia-noite UTC e devolve "AAAA-MM-DD" na leitura,
// para não repetir o problema de fuso do atendimento.
export function dataDoDia(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

// Período de dias "AAAA-MM-DD" -> intervalo [início, fim) para campos gravados
// com dataDoDia (meia-noite UTC), como a data do encontro. Não use o intervalo
// de Brasília (painel/calculo-painel) nesses campos: ele perde o primeiro dia
// e pega o dia seguinte ao fim.
export function intervaloDeDias(inicio: string, fim: string) {
  const desde = dataDoDia(inicio);
  const ate = dataDoDia(fim);
  ate.setUTCDate(ate.getUTCDate() + 1);
  return { desde, ate };
}

export async function garantirAtividade(
  prisma: PrismaService,
  id: number,
  organizacaoId: number,
) {
  const atividade = await prisma.atividade.findFirst({
    where: { id, projeto: { is: { organizacaoId } } },
    select: { id: true, projetoId: true, situacao: true },
  });
  if (!atividade) throw new NotFoundException('Atividade não encontrada.');
  return atividade;
}

export async function garantirEncontro(
  prisma: PrismaService,
  id: number,
  organizacaoId: number,
) {
  const encontro = await prisma.encontro.findFirst({
    where: { id, atividade: { is: { projeto: { is: { organizacaoId } } } } },
    include: {
      atividade: { select: { id: true, nome: true, projetoId: true, situacao: true } },
    },
  });
  if (!encontro) throw new NotFoundException('Encontro não encontrado.');
  return encontro;
}
