import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { EvolucaoPanel } from "@/components/EvolucaoPanel";
import { SensitiveNote } from "@/components/SaveStatus";
import { usePermissoes, useStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/fichas")({
  head: () => ({
    meta: [
      { title: "Fichas de Evolução | Gestão MDCA" },
      {
        name: "description",
        content:
          "Linha do tempo de atendimentos e encaminhamentos por educando, com registro de quem atendeu e quando.",
      },
      { property: "og:title", content: "Fichas de Evolução | Gestão MDCA" },
      {
        property: "og:description",
        content: "Histórico cronológico de atendimentos e encaminhamentos da equipe técnica.",
      },
    ],
  }),
  component: Fichas,
});

function Fichas() {
  const { educandos } = useStore();
  const perm = usePermissoes();
  const [educandoId, setEducandoId] = useState(educandos[0]?.id ?? "");

  return (
    <div className="max-w-4xl">
      <PageHeader
        titulo="Fichas de Evolução"
        descricao="Histórico cronológico dos atendimentos e encaminhamentos de cada educando."
      />

      {!perm.verEvolucao ? (
        <SensitiveNote>
          Seu perfil atual (Educador) não tem acesso às fichas de evolução.
        </SensitiveNote>
      ) : (
        <>
          <div className="card-surface mb-5 flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm text-muted-foreground">Educando</span>
            <Select value={educandoId} onValueChange={setEducandoId}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Selecione o educando" />
              </SelectTrigger>
              <SelectContent>
                {educandos.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome} {e.situacaoVinculo === "Inativo" ? "(inativo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {educandoId && <EvolucaoPanel educandoId={educandoId} />}
        </>
      )}
    </div>
  );
}
