import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SaveStatus } from "@/components/SaveStatus";
import { useRascunho } from "@/lib/rascunho";
import { novoId, usePermissoes, useSalvar, useStore } from "@/lib/store";
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
  const {
    atividades,
    encontros,
    educandos,
    iniciativaNome,
    criarEncontro: gravarEncontro,
    registrarFrequencia,
    mudarSituacaoEncontro,
  } = useStore();
  const perm = usePermissoes();
  const { estado, salvar, mensagem } = useSalvar();
  const [aberto, setAberto] = useState(false);
  const atividade = atividades.find((a) => a.id === id);

  const [form, setForm, limparForm] = useRascunho(`rascunho:encontro:${id}`, {
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
      presencas: elegiveis.map((e) => ({ educandoId: e.id, presente: false, observacao: "" })),
    };
    const ok = await salvar(() => gravarEncontro(registro));
    if (ok) {
      limparForm();
      setAberto(false);
    }
  };

  const mudarSituacao = (encontroId: string, situacao: Encontro["situacao"]) =>
    salvar(() => mudarSituacaoEncontro(encontroId, situacao));

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
            {perm.registrarAtividade && (
              <Button onClick={() => setAberto((v) => !v)}>
                <Plus className="size-4" /> Novo encontro
              </Button>
            )}
          </div>
        }
      />

      {mensagem && <p className="mb-3 text-sm text-destructive">{mensagem}</p>}

      {perm.registrarAtividade && aberto && (
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
                {perm.registrarAtividade && (
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
                )}
              </div>
            </div>
            {e.observacoes && <p className="mt-2 text-sm">{e.observacoes}</p>}

            <Chamada
              encontro={e}
              educandos={educandos}
              podeRegistrar={perm.registrarAtividade}
              onSalvar={(participantes) => registrarFrequencia(e.id, participantes)}
            />
          </section>
        ))}
        {daAtividade.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum encontro cadastrado.</p>
        )}
      </div>
    </div>
  );
}

function Chamada({
  encontro,
  educandos,
  podeRegistrar,
  onSalvar,
}: {
  encontro: Encontro;
  educandos: { id: string; nome: string }[];
  podeRegistrar: boolean;
  onSalvar: (participantes: { educandoId: string; presente: boolean; observacao?: string }[]) => void;
}) {
  const { estado, salvar, mensagem } = useSalvar();
  const [lista, setLista, limpar] = useRascunho(`rascunho:frequencia:${encontro.id}`, encontro.presencas);

  const gravar = async () => {
    const ok = await salvar(() => onSalvar(lista));
    if (ok) limpar();
  };

  const alterar = (educandoId: string, presente: boolean) =>
    setLista((atual) => atual.map((p) => (p.educandoId === educandoId ? { ...p, presente } : p)));

  const observar = (educandoId: string, observacao: string) =>
    setLista((atual) => atual.map((p) => (p.educandoId === educandoId ? { ...p, observacao } : p)));

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium">Lista de presença</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {lista.map((p) => {
          const edu = educandos.find((x) => x.id === p.educandoId);
          return (
            <li key={p.educandoId} className="rounded-lg border border-border px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>{edu?.nome ?? p.educandoId}</span>
                {podeRegistrar ? (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox checked={p.presente} onCheckedChange={(c) => alterar(p.educandoId, !!c)} />
                    {p.presente ? "Presente" : "Ausente"}
                  </label>
                ) : (
                  <Badge variant={p.presente ? "default" : "secondary"}>
                    {p.presente ? "Presente" : "Ausente"}
                  </Badge>
                )}
              </div>
              {podeRegistrar && (
                <Input
                  className="mt-2"
                  placeholder="Observação (opcional)"
                  value={p.observacao ?? ""}
                  onChange={(ev) => observar(p.educandoId, ev.target.value)}
                />
              )}
            </li>
          );
        })}
        {lista.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum educando vinculado a este encontro.</li>
        )}
      </ul>
      {podeRegistrar && (
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" size="sm" onClick={gravar} disabled={estado === "saving"}>
            Salvar chamada
          </Button>
          <SaveStatus estado={estado} />
          {mensagem && <span className="text-sm text-destructive">{mensagem}</span>}
        </div>
      )}
    </div>
  );
}
