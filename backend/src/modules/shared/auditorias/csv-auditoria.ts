import { Auditoria } from '@prisma/client';

type RegistroComAutor = Auditoria & { usuario: { id: number; nome: string } | null };

const COLUNAS = [
  'data_hora',
  'usuario_id',
  'usuario_nome',
  'perfil',
  'acao',
  'recurso_tipo',
  'recurso_id',
  'resumo',
  'alteracoes',
  'ip',
  'request_id',
];

// DD/MM/AAAA HH:MM:SS, no horário de Brasília.
const dataBrasilia = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function celula(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  let texto = String(valor);
  // Evita que o Excel interprete o conteúdo como fórmula (CSV injection):
  // resumos e alterações podem conter texto digitado por usuários.
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// Separador ";" e BOM UTF-8: abre direto no Excel em português com acentos corretos.
export function gerarCsvAuditoria(registros: RegistroComAutor[]): string {
  const linhas = registros.map((r) =>
    [
      dataBrasilia.format(r.dataHora),
      r.usuarioId,
      r.usuario?.nome,
      r.perfil,
      r.acao,
      r.recursoTipo,
      r.recursoId,
      r.resumo,
      r.alteracoes ? JSON.stringify(r.alteracoes) : null,
      r.ip,
      r.requestId,
    ]
      .map(celula)
      .join(';'),
  );
  return '﻿' + [COLUNAS.join(';'), ...linhas].join('\r\n') + '\r\n';
}
