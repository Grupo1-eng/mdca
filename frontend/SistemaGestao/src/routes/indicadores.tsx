import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SensitiveNote } from "@/components/SaveStatus";
import { baixarArquivo, indicadoresParaCsv, indicadoresParaPdf } from "@/lib/exportar";
import { usePermissoes, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/indicadores")({
  head: () => ({
    meta: [
      { title: "Painel de Indicadores | Gestão MDCA" },
      {
        name: "description",
        content:
          "Indicadores de educandos atendidos, atendimentos, encontros e frequência média por período e iniciativa.",
      },
      { property: "og:title", content: "Painel de Indicadores | Gestão MDCA" },
      { property: "og:description", content: "Métricas de atendimento da MDCA com exportação." },
    ],
  }),
  component: Indicadores,
});

function Indicadores() {
  const { iniciativas, indicadores } = useStore();
  const perm = usePermissoes();

  const hoje = new Date().toISOString().slice(0, 10);
  const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(trintaDias);
  const [fim, setFim] = useState(hoje);
  const [iniciativa, setIniciativa] = useState("todas");

  if (!perm.verIndicadores) {
    return (
      <div className="max-w-2xl">
        <PageHeader titulo="Painel de Indicadores" />
        <SensitiveNote>
          Painel disponível para Coordenação e Administrativo.
        </SensitiveNote>
      </div>
    );
  }

  const dados = indicadores({ inicio, fim, programaId: iniciativa });
  const metricas = [
    { label: "Educandos atendidos", valor: dados.educandosAtendidos, nota: "com ao menos 1 atendimento no período" },
    { label: "Atendimentos registrados", valor: dados.atendimentosRegistrados, nota: "fichas de evolução no período" },
    { label: "Encontros realizados", valor: dados.encontrosRealizados, nota: "encontros com situação Realizado" },
    { label: "Frequência média", valor: `${dados.frequenciaMedia}%`, nota: "presenças / total de marcações" },
  ];

  const exportar = (formato: "csv" | "pdf") => {
    const periodo = `Período ${inicio} a ${fim}`;
    if (formato === "csv") {
      baixarArquivo(
        "indicadores-mdca.csv",
        new Blob([indicadoresParaCsv(dados)], { type: "text/csv;charset=utf-8" }),
      );
      return;
    }
    baixarArquivo(
      "indicadores-mdca.pdf",
      new Blob([indicadoresParaPdf(dados, periodo)], { type: "application/pdf" }),
    );
  };

  return (
    <div>
      <PageHeader
        titulo="Painel de Indicadores"
        descricao="Métricas distintas de atendimento, sempre filtráveis por período e iniciativa."
        acoes={
          <>
            <Button variant="outline" onClick={() => exportar("csv")}>
              <Download className="size-4" /> Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => exportar("pdf")}>
              <Download className="size-4" /> Exportar PDF
            </Button>
          </>
        }
      />

      <div className="card-surface mb-5 flex flex-wrap items-end gap-4 p-4">
        <div>
          <Label className="mb-1.5 block text-sm">Início do período</Label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm">Fim do período</Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="min-w-72 flex-1">
          <Label className="mb-1.5 block text-sm">Projeto / Serviço / Programa</Label>
          <Select value={iniciativa} onValueChange={setIniciativa}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as iniciativas</SelectItem>
              {iniciativas.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricas.map((m) => (
          <div key={m.label} className="card-surface p-5">
            <p className="text-sm text-muted-foreground">{m.label}</p>
            <p className="mt-2 text-3xl font-semibold">{m.valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.nota}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
