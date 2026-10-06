export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--muted-foreground)]">
      <span className="w-4 h-4 border-2 border-[var(--border)] border-t-[#1a3a6b] rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-lg px-5 py-4">
      {message}
    </div>
  );
}
