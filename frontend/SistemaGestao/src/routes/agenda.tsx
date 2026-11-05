import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SaveStatus } from "@/components/SaveStatus";
import { useRascunho } from "@/lib/rascunho";
import { novoId, useSalvar, useStore } from "@/lib/store";
import type { Compromisso } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | Gestão MDCA" },
      {
        name: "description",
        content: "Agenda institucional por dia, semana e mês, com compromissos realizados e cancelados.",
      },
      { property: "og:title", content: "Agenda | Gestão MDCA" },
      { property: "og:description", content: "Compromissos da equipe da MDCA por dia, semana e mês." },
    ],
  }),
  component: Agenda,
});

const br = (d: string) => d.split("-").reverse().join("/");

function Agenda() {
  const { compromissos, usuario, criarCompromisso, editarCompromisso, mudarSituacaoCompromisso } = useStore();
  const { estado, salvar, mensagem } = useSalvar();
  const [visao, setVisao] = useState<"dia" | "semana" | "mes">("semana");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm, limparForm] = useRascunho<Omit<Compromisso, "id">>("rascunho:compromisso", {
    titulo: "",
    data: hoje,
    horario: "09:00",
    local: "",
    responsavel: usuario?.nome ?? "",
    tipo: "Atendimento",
    status: "Agendado",
    observacoes: "",
  });

  const dentroDaVisao = (data: string) => {
    if (visao === "dia") return data === hoje;
    const d = new Date(data + "T00:00");
    const ref = new Date(hoje + "T00:00");
    if (visao === "semana") {
      const diff = (d.getTime() - ref.getTime()) / 86400000;
      return diff >= -3 && diff <= 7;
    }
    return data.slice(0, 7) === hoje.slice(0, 7);
  };

  const lista = compromissos
    .filter((c) => dentroDaVisao(c.data))
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

  const submeter = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const ok = await salvar(() => {
      if (editando) {
        editarCompromisso(editando, {
          titulo: form.titulo,
          data: form.data,
          horario: form.horario,
          observacoes: form.observacoes,
          local: form.local,
          tipo: form.tipo,
        });
      } else {
        criarCompromisso({
          id: novoId("cmp"),
          ...form,
          responsavel: usuario?.nome ?? "",
          status: "Agendado",
        });
      }
    });
    if (ok) {
      limparForm();
      setAberto(false);
      setEditando(null);
    }
  };

  const editar = (c: Compromisso) => {
    setEditando(c.id);
    const { id: _id, ...resto } = c;
    setForm(resto);
    setAberto(true);
  };

  const mudarStatus = (id: string, status: Compromisso["status"]) =>
    salvar(() => mudarSituacaoCompromisso(id, status));

  return (
    <div>
      <PageHeader
        titulo="Agenda"
        descricao="Compromissos da equipe. Registros cancelados permanecem no histórico."
        acoes={
          <div className="flex items-center gap-3">
            <SaveStatus estado={estado} />
            <Button
              onClick={() => {
                setEditando(null);
                setForm({ ...form, titulo: "", local: "", observacoes: "" });
                setAberto((v) => !v);
              }}
            >
              <Plus className="size-4" /> Novo compromisso
            </Button>
          </div>
        }
      />

      <Tabs value={visao} onValueChange={(v) => setVisao(v as typeof visao)} className="mb-4">
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
        </TabsList>
      </Tabs>

      {aberto && (
        <form onSubmit={submeter} className="card-surface mb-5 space-y-4 p-5">
          <h2 className="text-base font-semibold">
            {editando ? "Editar compromisso" : "Novo compromisso"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-sm">Título</Label>
              <Input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
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
              <Label className="mb-1.5 block text-sm">Responsável</Label>
              <Input value={editando ? form.responsavel : usuario?.nome ?? ""} disabled />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as Compromisso["tipo"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Atendimento">Atendimento</SelectItem>
                  <SelectItem value="Reunião">Reunião</SelectItem>
                  <SelectItem value="Visita domiciliar">Visita domiciliar</SelectItem>
                  <SelectItem value="Encontro de atividade">Encontro de atividade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mensagem && <p className="text-sm text-destructive md:col-span-2">{mensagem}</p>}
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
              Salvar compromisso
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAberto(false);
                setEditando(null);
              }}
            >
              Cancelar
            </Button>
            <SaveStatus estado={estado} />
          </div>
        </form>
      )}

      <div className="space-y-3">
        {lista.map((c) => {
          const doDia = c.data === hoje;
          return (
            <article
              key={c.id}
              className={`card-surface flex flex-wrap items-center justify-between gap-3 p-4 ${
                doDia ? "border-primary bg-secondary" : ""
              } ${c.status === "Cancelado" ? "opacity-70" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {c.titulo}
                  {doDia && <Badge variant="outline">Hoje</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {br(c.data)} às {c.horario} · {c.local || "sem local"} ·{" "}
                  {c.responsavel || "sem responsável"}
                </p>
                {c.observacoes && <p className="mt-1 text-xs">{c.observacoes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{c.tipo}</Badge>
                <Badge
                  variant={
                    c.status === "Cancelado"
                      ? "destructive"
                      : c.status === "Realizado"
                        ? "default"
                        : "outline"
                  }
                >
                  {c.status}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => editar(c)}>
                  Editar
                </Button>
                {c.status === "Agendado" && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => mudarStatus(c.id, "Realizado")}>
                      Marcar realizado
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => mudarStatus(c.id, "Cancelado")}>
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </article>
          );
        })}
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum compromisso nesta visualização.</p>
        )}
      </div>
    </div>
  );
}
