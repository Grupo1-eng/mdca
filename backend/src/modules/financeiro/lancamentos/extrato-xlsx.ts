import { Row, Workbook } from 'exceljs';
import { DadosDoExtrato } from './extrato';

export const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const LARGURAS = [12, 36, 22, 18, 22, 12, 14, 14];
const FORMATO_DINHEIRO = '#,##0.00';
const COLUNAS_DE_VALOR = [7, 8];

function formatarValores(linha: Row): Row {
  for (const coluna of COLUNAS_DE_VALOR) linha.getCell(coluna).numFmt = FORMATO_DINHEIRO;
  return linha;
}

export async function gerarPlanilhaDoExtrato(dados: DadosDoExtrato): Promise<Buffer> {
  const workbook = new Workbook();
  const aba = workbook.addWorksheet('Extrato');

  aba.addRow([dados.titulo]).font = { bold: true };
  for (const filtro of dados.filtros) aba.addRow([filtro]);
  aba.addRow([dados.emissao]);
  aba.addRow([]);
  aba.addRow(dados.colunas).font = { bold: true };
  for (const linha of dados.linhas) formatarValores(aba.addRow(linha));
  const totais = formatarValores(aba.addRow(dados.totais));
  totais.font = { bold: true };

  LARGURAS.forEach((largura, i) => {
    aba.getColumn(i + 1).width = largura;
  });

  return Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
}
