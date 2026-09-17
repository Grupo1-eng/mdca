import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SaveStatus } from "@/components/SaveStatus";
import { novoId, useSalvar, useStore } from "@/lib/store";
import type { Encontro } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/atividades/$id")({
  head: () => ({
    meta: [
      { title: "Encontros da atividade | Gestão MDCA" },
      {
        name: "description",
        content: "Encontros de uma atividade e marcação de presença dos educandos participantes.",
      },
      { property: "og:title", content: "Encontros da atividade | Gestão MDCA" },
      { property: "og:description", content: "Registro de encontros e frequência por atividade." },
    ],
  }),
  component: AtividadeDetalhe,
});

function AtividadeDetalhe() {
  const { id } = useParams({ from: "/atividades/$id" });
  const { atividades, encontros, setEncontros, educandos, iniciativaNome } = useStore();
  const { estado, salvar } = useSalvar();
  const [aberto, setAberto] = useState(false);
  const atividade = atividades.find((a) => a.id === id);

  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    horario: "14:00",
    local: "",
    situacao: "Planejado" as Encontro["situacao"],
    observacoes: "",
  });

  if (!atividade) {
    return (
      <div className="card-surface p-6">
        <p className="text-sm">Atividade não encontrada.</p>
        <Button variant="link" asChild className="px-0">
          <Link to="/atividades">Voltar</Link>
        </Button>
      </div>
    );
  }

  const daAtividade = encontros
    .filter((e) => e.atividadeId === atividade.id)
    .sort((a, b) => b.data.localeCompare(a.data));

  const elegiveis = educandos.filter((e) => e.iniciativaId === atividade.iniciativaId);

  const criarEncontro = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const registro: Encontro = {
      id: novoId("enco"),
      atividadeId: atividade.id,
      ...form,
      presencas: elegiveis.map((e) => ({ educandoId: e.id, presente: false })),
    };
    const ok = await salvar(() => setEncontros((l) => [registro, ...l]));
    if (ok) setAberto(false);
  };

  const marcar = (encontroId: string, educandoId: string, presente: boolean) =>
    salvar(() =>
      setEncontros((lista) =>
        lista.map((e) =>
          e.id === encontroId
            ? {
                ...e,
                presencas: e.presencas.some((p) => p.educandoId === educandoId)
                  ? e.presencas.map((p) => (p.educandoId === educandoId ? { ...p, presente } : p))
                  : [...e.presencas, { educandoId, presente }],
              }
            : e,
        ),
      ),
    );

  const mudarSituacao = (encontroId: string, situacao: Encontro["situacao"]) =>
    salvar(() =>
      setEncontros((lista) =>
        lista.map((e) => (e.id === encontroId ? { ...e, situacao } : e)),
      ),
    );

  return (
    <div className="max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link to="/atividades">
          <ArrowLeft className="size-4" /> Atividades
        </Link>
      </Button>

      <PageHeader
        titulo={atividade.nome}
        descricao={`${iniciativaNome(atividade.iniciativaId)} · responsável: ${atividade.responsavel}`}
        acoes={
          <div className="flex items-center gap-3">
            <SaveStatus estado={estado} />
            <Button onClick={() => setAberto((v) => !v)}>
              <Plus className="size-4" /> Novo encontro
            </Button>
          </div>
        }
      />

      {aberto && (
        <form onSubmit={criarEncontro} className="card-surface mb-5 space-y-4 p-5">
          <h2 className="text-base font-semibold">Cadastrar encontro</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">Data</Label>
              <Input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Horário</Label>
              <Input
                type="time"
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Local</Label>
              <Input
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Situação</Label>
              <Select
                value={form.situacao}
                onValueChange={(v) => setForm({ ...form, situacao: v as Encontro["situacao"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejado">Planejado</SelectItem>
                  <SelectItem value="Realizado">Realizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-sm">Observações</Label>
              <Textarea
                rows={2}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={estado === "saving"}>
              Salvar encontro
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {daAtividade.map((e) => (
          <section key={e.id} className="card-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {e.data.split("-").reverse().join("/")} às {e.horario}
                </p>
                <p className="text-sm text-muted-foreground">{e.local || "Local não informado"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={e.situacao === "Realizado" ? "default" : "secondary"}>
                  {e.situacao}
                </Badge>
                <Select
                  value={e.situacao}
                  onValueChange={(v) => mudarSituacao(e.id, v as Encontro["situacao"])}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                    <SelectItem value="Realizado">Realizado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {e.observacoes && <p className="mt-2 text-sm">{e.observacoes}</p>}

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Lista de presença</p>
              <ul className="grid gap-2 md:grid-cols-2">
                {e.presencas.map((p) => {
                  const edu = educandos.find((x) => x.id === p.educandoId);
                  return (
                    <li
                      key={p.educandoId}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>{edu?.nome ?? p.educandoId}</span>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox
                          checked={p.presente}
                          onCheckedChange={(c) => marcar(e.id, p.educandoId, !!c)}
                        />
                        {p.presente ? "Presente" : "Ausente"}
                      </label>
                    </li>
                  );
                })}
                {e.presencas.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    Nenhum educando vinculado a este encontro.
                  </li>
                )}
              </ul>
            </div>
          </section>
        ))}
        {daAtividade.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum encontro cadastrado.</p>
        )}
      </div>
    </div>
  );
}
