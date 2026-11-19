import { useState } from "react";

export type FormatoExportacao = "planilha" | "pdf";

const textos: Record<FormatoExportacao, { rotulo: string; erro: string }> = {
  planilha: { rotulo: "Exportar planilha", erro: "Não foi possível gerar a planilha." },
  pdf: { rotulo: "Exportar PDF", erro: "Não foi possível gerar o PDF." },
};

/** Botão de exportação (planilha ou PDF): mostra o andamento e o erro, se houver. */
export default function BotaoExportar({ gerar, desabilitado, formato = "planilha" }: {
  gerar: () => Promise<void>;
  desabilitado?: boolean;
  formato?: FormatoExportacao;
}) {
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const exportar = async () => {
    setExportando(true);
    setErro(null);
    try {
      await gerar();
    } catch {
      setErro(textos[formato].erro);
    } finally {
      setExportando(false);
    }
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={exportar}
        disabled={exportando || desabilitado}
        className="text-xs border border-[var(--border)] rounded px-3 py-1.5 hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {exportando ? "Gerando…" : textos[formato].rotulo}
      </button>
      {erro && <p className="text-[10px] text-red-600">{erro}</p>}
    </div>
  );
}
