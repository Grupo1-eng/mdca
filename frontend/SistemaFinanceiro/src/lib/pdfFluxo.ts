// Documento PDF do relatório de fluxo de caixa (RF29, RF60). Função pura:
// recebe a série já calculada por `serieFluxoCaixaPeriodo` (a mesma da tela e
// da planilha) e monta o `DocumentoPdf` que `lib/pdf.ts` desenha.
import type { AgrupamentoFluxo, PontoFluxoCaixaPeriodo } from "./aggregations";
import { dinheiroPdf, type CorPdf, type DocumentoPdf, type GraficoPizzaPdf, type TomIndicador } from "./pdf";
import { totaisFluxo } from "./relatorios";

const AGRUPAMENTO: Record<AgrupamentoFluxo, string> = { semana: "semana", mes: "mês", ano: "ano" };

// Mesmas cores da tela: verde para entradas, vermelho para saídas; o tom
// claro é a parte ainda pendente.
const VERDE: CorPdf = [14, 126, 110]; // #0e7e6e
const VERDE_CLARO: CorPdf = [167, 216, 208];
const VERMELHO: CorPdf = [224, 85, 85]; // #e05555
const VERMELHO_CLARO: CorPdf = [245, 190, 190];

/** Evita resíduo de ponto flutuante (0,1 + 0,2) na parte pendente. */
function centavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Pizza do previsto dividido em realizado e pendente. As realizadas fazem
 * parte das previstas, então as fatias são "realizado" e "previsto − realizado"
 * (somar previsto e realizado contaria o realizado duas vezes).
 */
function pizzaPrevistoRealizado(opcoes: {
  titulo: string; previsto: number; realizado: number;
  rotuloRealizado: string; rotuloPendente: string; rotuloPrevisto: string;
  cor: CorPdf; corPendente: CorPdf; vazio: string;
}): GraficoPizzaPdf {
  return {
    titulo: opcoes.titulo,
    fatias: [
      { rotulo: opcoes.rotuloRealizado, valor: centavos(opcoes.realizado), cor: opcoes.cor },
      { rotulo: opcoes.rotuloPendente, valor: centavos(opcoes.previsto - opcoes.realizado), cor: opcoes.corPendente },
    ],
    rodape: `${opcoes.rotuloPrevisto}: ${dinheiroPdf(opcoes.previsto)}`,
    vazio: opcoes.vazio,
  };
}

export interface EntradaPdfFluxo {
  agrupamento: AgrupamentoFluxo;
  pontos: PontoFluxoCaixaPeriodo[];
  /** Período escolhido na tela, já por extenso (ex.: "novembro de 2026"). */
  periodo: string;
  organizacao: string | null;
  usuario: string | null;
  geradoEm: Date;
}

/** O rótulo da semana é só o dia de início ("01/11"); no papel, fica explícito. */
function rotuloDoPeriodo(label: string, agrupamento: AgrupamentoFluxo): string {
  return agrupamento === "semana" ? `Semana de ${label}` : label;
}

function tomDoResultado(valor: number): TomIndicador {
  return valor < 0 ? "negativo" : "neutro";
}

export function documentoFluxoPdf(entrada: EntradaPdfFluxo): DocumentoPdf {
  const { agrupamento, pontos, periodo, organizacao, usuario, geradoEm } = entrada;
  const t = totaisFluxo(pontos);
  const resultadoPrevisto = t.entradasPrevistas - t.saidasPrevistas;

  return {
    titulo: "Fluxo de Caixa",
    organizacao,
    filtros: [`Período: ${periodo}`, `Agrupado por ${AGRUPAMENTO[agrupamento]}`],
    usuario,
    geradoEm,
    blocos: [
      { tipo: "secao", titulo: "Resumo do período" },
      {
        tipo: "indicadores",
        itens: [
          { rotulo: "Entradas realizadas", valor: dinheiroPdf(t.entradasRealizadas), tom: "positivo" },
          { rotulo: "Saídas realizadas", valor: dinheiroPdf(t.saidasRealizadas), tom: "negativo" },
          { rotulo: "Resultado realizado", valor: dinheiroPdf(t.saldoRealizado), tom: tomDoResultado(t.saldoRealizado) },
          { rotulo: "Entradas previstas", valor: dinheiroPdf(t.entradasPrevistas) },
          { rotulo: "Saídas previstas", valor: dinheiroPdf(t.saidasPrevistas) },
          { rotulo: "Resultado previsto", valor: dinheiroPdf(resultadoPrevisto), tom: tomDoResultado(resultadoPrevisto) },
        ],
      },
      { tipo: "secao", titulo: "Previsto x realizado" },
      {
        tipo: "pizzas",
        graficos: [
          pizzaPrevistoRealizado({
            titulo: "Entradas previstas x realizadas",
            previsto: t.entradasPrevistas, realizado: t.entradasRealizadas,
            rotuloRealizado: "Recebidas", rotuloPendente: "A receber", rotuloPrevisto: "Previstas",
            cor: VERDE, corPendente: VERDE_CLARO, vazio: "Nenhuma entrada prevista no período.",
          }),
          pizzaPrevistoRealizado({
            titulo: "Saídas previstas x realizadas",
            previsto: t.saidasPrevistas, realizado: t.saidasRealizadas,
            rotuloRealizado: "Pagas", rotuloPendente: "A pagar", rotuloPrevisto: "Previstas",
            cor: VERMELHO, corPendente: VERMELHO_CLARO, vazio: "Nenhuma saída prevista no período.",
          }),
        ],
      },
      { tipo: "secao", titulo: `Realizado x previsto por ${AGRUPAMENTO[agrupamento]}` },
      {
        tipo: "tabela",
        // Títulos em duas linhas: numa só, alguns quebram e outros não.
        colunas: [
          { titulo: "Período" },
          { titulo: "Entradas\nprevistas", formato: "dinheiro", largura: 29 },
          { titulo: "Entradas\nrealizadas", formato: "dinheiro", largura: 29 },
          { titulo: "Saídas\nprevistas", formato: "dinheiro", largura: 29 },
          { titulo: "Saídas\nrealizadas", formato: "dinheiro", largura: 29 },
          { titulo: "Saldo\nrealizado", formato: "dinheiro", largura: 29 },
        ],
        linhas: pontos.map((p) => [
          rotuloDoPeriodo(p.label, agrupamento), p.previsto, p.realizado, p.saidasPrevisto, p.saidasRealizado, p.realizado - p.saidasRealizado,
        ]),
        totais: ["Total", t.entradasPrevistas, t.entradasRealizadas, t.saidasPrevistas, t.saidasRealizadas, t.saldoRealizado],
        vazio: "Nenhum lançamento no período.",
      },
    ],
  };
}
