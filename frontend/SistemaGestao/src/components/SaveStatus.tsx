import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { SaveState } from "@/lib/store";

export function SaveStatus({ estado }: { estado: SaveState }) {
  if (estado === "idle") return null;
  if (estado === "saving")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Salvando…
      </span>
    );
  if (estado === "saved")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-success">
        <Check className="size-4" /> Salvo com sucesso
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="size-4" /> Erro ao salvar — os dados preenchidos foram mantidos
    </span>
  );
}

export function SensitiveNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="sensitive-field flex items-start gap-2 p-3 text-sm">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
