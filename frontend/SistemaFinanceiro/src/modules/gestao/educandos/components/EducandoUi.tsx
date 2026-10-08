import type { ReactNode } from "react"
import type { SaveState } from "../EducandosContext"

export const inputClass =
  "w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/15 transition-all disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"

export const textareaClass = `${inputClass} h-auto py-2`

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl text-[var(--foreground)]">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {descricao}
          </p>
        )}
      </div>
      {acoes && (
        <div className="flex flex-wrap items-center gap-3">{acoes}</div>
      )}
    </div>
  )
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-lg border border-[var(--border)] bg-white ${className}`}
    >
      {children}
    </section>
  )
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode
  variant?: "default" | "secondary" | "outline" | "danger"
}) {
  const variants = {
    default: "bg-[#0e7e6e]/10 text-[#0e7e6e]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
    outline: "border border-[var(--border)] text-[var(--muted-foreground)]",
    danger: "bg-red-50 text-red-600",
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-1 rounded ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

export function SensitiveNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      {children}
    </div>
  )
}

export function SaveStatus({ estado }: { estado: SaveState }) {
  if (estado === "idle") return null
  const config = {
    saving: ["Salvando…", "text-[var(--muted-foreground)]"],
    saved: ["Salvo com sucesso", "text-[#0e7e6e]"],
    error: [
      "Erro ao salvar — os dados preenchidos foram mantidos",
      "text-red-600",
    ],
  } as const
  const [texto, cor] = config[estado]
  return <span className={`text-sm ${cor}`}>{texto}</span>
}

export function Field({
  label,
  children,
  full = false,
}: {
  label: string
  children: ReactNode
  full?: boolean
}) {
  return (
    <label className={full ? "md:col-span-2" : undefined}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      {children}
    </label>
  )
}
