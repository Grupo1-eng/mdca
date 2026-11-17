import { useEffect, useMemo, useState } from "react";
import { fmt } from "@/lib/format";
import { useProjetos } from "@/hooks/useProjetos";
import { useCategorias } from "@/hooks/useCategorias";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useContatos } from "@/hooks/useContatos";
import { useAuth } from "@/context/AuthContext";
import { usePeriodo } from "@/context/PeriodoContext";
import { intervaloValido } from "@/lib/aggregations";
import { baixarPlanilha } from "@/lib/planilha";
import {
  relatorioExecucaoProjeto, type MovimentoPorOrigem, type RelatorioProjeto,
} from "@/lib/relatorioProjeto";
import { LoadingState, ErrorState } from "./StatusMessage";
import FiltroPeriodo, { formatIntervalo } from "./FiltroPeriodo";
import { chevronBg, selectCls } from "./ModalShell";
import BotaoExportar from "./BotaoExportar";

// US-16: relatório de execução orçamentária de um projeto — dados do projeto,
// entradas e saídas por origem, saldo e orçado x realizado por categoria.

function TabelaOrigem({ titulo, itens, total, cor }: {
  titulo: string; itens: MovimentoPorOrigem[]; total: number; cor: string;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-2.5 bg-[#f8f9fc] border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{titulo}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">Origem</th>
            <th className="text-right px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">Valor</th>
          </tr>
        </thead>
        <tbody>
          {itens.length === 0 && (
            <tr><td colSpan={2} className="px-4 py-5 text-center text-xs text-[var(--muted-foreground)]">Nenhum lançamento no período.</td></tr>
          )}
          {itens.map((i) => (
            <tr key={i.contatoId ?? "sem-origem"} className="border-t border-[var(--border)]">
              <td className="px-4 py-2.5 text-xs">{i.origem}</td>
              <td className={`px-4 py-2.5 text-xs font-mono text-right ${cor}`}>{fmt(i.valor)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[#0f1e3d]/20 bg-[#edf0f5]">
            <td className="px-4 py-2.5 text-xs font-semibold">Total</td>
            <td className={`px-4 py-2.5 text-xs font-mono text-right font-semibold ${cor}`}>{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Cartao({ rotulo, valor, cor = "text-[var(--foreground)]" }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-4 bg-white">
      <p className="text-xs text-[var(--muted-foreground)] mb-1.5">{rotulo}</p>
      <p className={`text-xl font-semibold ${cor}`}>{valor}</p>
    </div>
  );
}

function textoPercentual(p: number | null): string {
  return p === null ? "—" : `${p}%`;
}

export default function RelatorioExecucao() {
  const projetos = useProjetos();
  const categorias = useCategorias();
  const orcamentos = useOrcamentos();
  const lancamentos = useLancamentos();
  const contatos = useContatos();
  const { user } = useAuth();
  const { periodo, setPeriodo, dataIni, setDataIni, dataFim, setDataFim, intervalo } = usePeriodo();

  const fontes = [projetos, categorias, orcamentos, lancamentos, contatos];
  const loading = fontes.some((f) => f.loading);
  const error = fontes.find((f) => f.error)?.error ?? null;

  const [projetoId, setProjetoId] = useState<number | null>(null);

  // Seleciona o primeiro projeto assim que a lista chega.
  useEffect(() => {
    if (projetoId === null && projetos.data.length > 0) setProjetoId(projetos.data[0].id);
  }, [projetos.data, projetoId]);

  const projeto = projetos.data.find((p) => p.id === projetoId) ?? null;

  const relatorio: RelatorioProjeto | null = useMemo(
    () => projeto
      ? relatorioExecucaoProjeto({
          projeto,
          categorias: categorias.data,
          orcamentos: orcamentos.data,
          lancamentos: lancamentos.data,
          contatos: contatos.data,
          intervalo,
        })
      : null,
    [projeto, categorias.data, orcamentos.data, lancamentos.data, contatos.data, intervalo],
  );

  const exportar = async () => {
    if (!relatorio) return;
    const linhasOrigem = (rotulo: string, itens: MovimentoPorOrigem[]) =>
      itens.map((i) => [rotulo, i.origem, null, null, i.valor] as (string | number | null)[]);
    await baixarPlanilha({
      titulo: `Execução Orçamentária — ${relatorio.nome}`,
      filtros: [
        `Projeto: ${relatorio.nome}`,
        `Descrição: ${relatorio.descricao ?? "—"}`,
        `Período dos lançamentos: ${formatIntervalo(periodo, intervalo)}`,
        "Orçado: orçamentos cadastrados do projeto · Realizado: saídas pagas · Entradas: recebidas",
        `Entradas: ${relatorio.totalEntradas.toFixed(2)} · Saídas: ${relatorio.totalSaidas.toFixed(2)} · Saldo do projeto: ${relatorio.saldo.toFixed(2)}`,
      ],
      usuario: user?.nome ?? null,
      geradoEm: new Date(),
      colunas: ["Seção", "Categoria / Origem", "Orçado", "Realizado", "Diferença / Valor"],
      linhas: [
        ...relatorio.categorias.map((c) => ["Categoria", c.categoria, c.orcado, c.realizado, c.diferenca] as (string | number | null)[]),
        ...linhasOrigem("Entrada", relatorio.entradasPorOrigem),
        ...linhasOrigem("Saída", relatorio.saidasPorOrigem),
      ],
      totais: ["Total", null, relatorio.totalOrcado, relatorio.totalRealizado, relatorio.totalDiferenca],
    }, [14, 36, 16, 16, 18]);
  };

  const selectFiltroCls = selectCls + " h-9 text-xs pr-8 w-auto min-w-[220px]";

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Execução Orçamentária</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Orçado vs. realizado por categoria, com entradas e saídas por origem
          </p>
        </div>
        <div className="flex items-start gap-2">
          <FiltroPeriodo
            periodo={periodo} setPeriodo={setPeriodo}
            dataIni={dataIni} setDataIni={setDataIni}
            dataFim={dataFim} setDataFim={setDataFim}
          />
          <BotaoExportar gerar={exportar} desabilitado={loading || !relatorio} />
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? <LoadingState /> : projetos.data.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg">
          Nenhum projeto cadastrado. Cadastre um projeto para gerar o relatório.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <select
              aria-label="Projeto"
              value={projetoId ?? ""}
              onChange={(e) => setProjetoId(e.target.value ? Number(e.target.value) : null)}
              className={selectFiltroCls} style={chevronBg}
            >
              {projetos.data.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {relatorio && (
            <>
              <div className="border border-[var(--border)] rounded-lg px-5 py-4 mb-4 bg-white">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-base font-semibold text-[var(--foreground)]">{relatorio.nome}</h3>
                  <span className="text-xs text-[var(--muted-foreground)]">{relatorio.status}</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-prose">
                  {relatorio.descricao || "Projeto sem descrição."}
                </p>
              </div>

              {!intervaloValido(intervalo) && (
                <div className="border border-amber-200 bg-amber-50 text-amber-800 text-sm rounded-lg px-5 py-3 mb-4">
                  Período inválido: a data inicial deve ser anterior ou igual à final.
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-2">
                <Cartao rotulo="Entradas recebidas" valor={fmt(relatorio.totalEntradas)} cor="text-[#0e7e6e]" />
                <Cartao rotulo="Saídas pagas" valor={fmt(relatorio.totalSaidas)} cor="text-red-600" />
                <Cartao
                  rotulo="Saldo do projeto"
                  valor={fmt(relatorio.saldo)}
                  cor={relatorio.saldo < 0 ? "text-red-600" : "text-[var(--foreground)]"}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mb-5">
                Entradas, saídas e realizado seguem o período {formatIntervalo(periodo, intervalo).toLowerCase()}.
                O orçado soma todos os orçamentos cadastrados do projeto, sem recorte de período.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <TabelaOrigem titulo="Entradas por origem" itens={relatorio.entradasPorOrigem} total={relatorio.totalEntradas} cor="text-[#0e7e6e]" />
                <TabelaOrigem titulo="Saídas por origem" itens={relatorio.saidasPorOrigem} total={relatorio.totalSaidas} cor="text-red-600" />
              </div>

              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Orçado x realizado por categoria</h3>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0f1e3d] text-white">
                      <th className="text-left px-5 py-3 text-xs font-medium">Categoria</th>
                      <th className="text-right px-4 py-3 text-xs font-medium">Orçado</th>
                      <th className="text-right px-4 py-3 text-xs font-medium">Realizado</th>
                      <th className="text-right px-4 py-3 text-xs font-medium">Diferença</th>
                      <th className="px-4 py-3 text-xs font-medium w-44">Execução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.categorias.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-[var(--muted-foreground)]">
                        Este projeto não tem orçamento cadastrado nem saídas pagas no período.
                      </td></tr>
                    )}
                    {relatorio.categorias.map((c) => (
                      <tr key={c.categoriaId} className={`border-t border-[var(--border)] ${c.estourada ? "bg-red-50" : "bg-white"}`}>
                        <td className="px-5 py-3 text-xs">
                          {c.categoria}
                          {c.estourada && (
                            <span className="ml-2 text-[10px] font-medium text-red-700 bg-red-100 rounded px-1.5 py-0.5">
                              {c.orcado === 0 ? "Sem orçamento" : "Acima do orçado"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{fmt(c.orcado)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{fmt(c.realizado)}</td>
                        <td className={`px-4 py-3 text-right font-mono text-xs font-medium ${c.diferenca < 0 ? "text-red-600" : "text-[var(--muted-foreground)]"}`}>{fmt(c.diferenca)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.estourada ? "bg-red-500" : "bg-[#0e7e6e]"}`}
                                style={{ width: `${Math.min(c.percentual ?? (c.realizado > 0 ? 100 : 0), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono w-10 text-right text-[var(--muted-foreground)]">{textoPercentual(c.percentual)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#0f1e3d]/20 bg-[#edf0f5]">
                      <td className="px-5 py-3 text-xs font-semibold">Total</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{fmt(relatorio.totalOrcado)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{fmt(relatorio.totalRealizado)}</td>
                      <td className={`px-4 py-3 text-right font-mono text-xs font-semibold ${relatorio.totalDiferenca < 0 ? "text-red-600" : ""}`}>{fmt(relatorio.totalDiferenca)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--muted-foreground)]">{textoPercentual(relatorio.percentualExecucao)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}