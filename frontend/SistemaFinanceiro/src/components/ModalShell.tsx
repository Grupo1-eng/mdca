import type React from "react";

// Estilos e estrutura de modal compartilhados pelas telas de Cadastros,
// Financeiro e Projetos — extraído do padrão que já existia (duplicado) em
// Cadastros.tsx, sem alterar a aparência.

export const selectCls =
  "w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all appearance-none";

export const inputMdCls =
  "w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all";

export const chevronBg = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 12px center",
};

export function FieldMd({ label, required: req, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function ModalShell({ title, subtitle, onClose, onSubmit, submitLabel, submitting, error, children }: {
  title: string; subtitle: string; onClose: () => void;
  onSubmit: (e: React.FormEvent) => void; submitLabel: string;
  submitting?: boolean; error?: string | null; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0f1e3d]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {children}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="flex-1 h-10 rounded-md bg-[#0f1e3d] text-white text-sm font-semibold hover:bg-[#1a3060] disabled:opacity-60 transition-colors cursor-pointer">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
