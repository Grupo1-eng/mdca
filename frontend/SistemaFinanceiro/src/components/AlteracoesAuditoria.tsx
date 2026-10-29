import { descreverAlteracao, nomeCampo } from "@/lib/auditoria";
import type { RegistroAuditoria } from "@/types/financeiro";

// Lista "campo: antes → depois" de um registro de auditoria. Usada na tela de
// Auditoria e no Histórico de cada cadastro.
export default function AlteracoesAuditoria({ registro }: { registro: RegistroAuditoria }) {
  const campos = Object.entries(registro.alteracoes ?? {});
  if (campos.length === 0) return null;

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {campos.map(([campo, alteracao]) => (
        <div key={campo} className="contents">
          <dt className="font-mono text-[var(--muted-foreground)]">{nomeCampo(campo)}</dt>
          <dd className="text-[var(--foreground)] break-words">{descreverAlteracao(campo, alteracao)}</dd>
        </div>
      ))}
    </dl>
  );
}
