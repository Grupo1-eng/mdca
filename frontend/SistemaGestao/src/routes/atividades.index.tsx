import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SaveStatus } from "@/components/SaveStatus";
import { novoId, useSalvar, useStore } from "@/lib/store";
import type { Atividade } from "@/lib/mock-data";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/atividades/")({
  head: () => ({
    meta: [
      { title: "Atividades e Frequência | Gestão MDCA" },
      {
        name: "description",
        content: "Atividades da MDCA, seus encontros e o controle de presença dos educandos.",
      },
      { property: "og:title", content: "Atividades e Frequência | Gestão MDCA" },
      { property: "og:description", content: "Oficinas, encontros e registro de presença." },
    ],
  }),
  component: Atividades,
});

function Atividades() {
  const { atividades, setAtividades, iniciativas, iniciativaNome, encontros } = useStore();
  const { estado, salvar } = useSalvar();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    iniciativaId: "",
    responsavel: "",
    descricao: "",
    situacao: "Ativa" as Atividade["situacao"],
  });

  const criar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const registro: Atividade = { id: novoId("atv"), ...form };
    const ok = await salvar(() => setAtividades((l) => [...l, registro]));
    if (ok) {
      setAberto(false);
      setForm({ nome: "", iniciativaId: "", responsavel: "", descricao: "", situacao: "Ativa" });
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Atividades e Frequência"
        descricao="Oficinas e ações coletivas vinculadas às iniciativas da organização."
        acoes={
          <Button onClick={() => setAberto((v) => !v)}>
            <Plus className="size-4" /> Nova atividade
          </Button>
        }
      />

      {aberto && (
        <form onSubmit={criar} className="card-surface mb-5 space-y-4 p-5">
          <h2 className="text-base font-semibold">Cadastrar atividade</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">Nome da atividade</Label>
              <Input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Responsável</Label>
              <Input
                required
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Projeto / Serviço / Programa</Label>
              <Select
                value={form.iniciativaId}
                onValueChange={(v) => setForm({ ...form, iniciativaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {iniciativas.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.codigo} · {i.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Situação</Label>
              <Select
                value={form.situacao}
                onValueChange={(v) => setForm({ ...form, situacao: v as Atividade["situacao"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Encerrada">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-sm">Descrição</Label>
              <Textarea
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={estado === "saving"}>
              Salvar atividade
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <SaveStatus estado={estado} />
          </div>
        </form>
      )}

      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atividade</TableHead>
              <TableHead>Iniciativa vinculada</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Encontros</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atividades.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {iniciativaNome(a.iniciativaId)}
                </TableCell>
                <TableCell>{a.responsavel}</TableCell>
                <TableCell>{encontros.filter((e) => e.atividadeId === a.id).length}</TableCell>
                <TableCell>
                  <Badge variant={a.situacao === "Ativa" ? "default" : "secondary"}>
                    {a.situacao}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/atividades/$id" params={{ id: a.id }}>
                      Encontros e presença
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
