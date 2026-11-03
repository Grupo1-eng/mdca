import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link2, Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SaveStatus } from "@/components/SaveStatus";
import { useRascunho } from "@/lib/rascunho";
import { novoId, usePermissoes, useSalvar, useStore } from "@/lib/store";
import type { Iniciativa } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos, Serviços e Programas | Gestão MDCA" },
      {
        name: "description",
        content:
          "Iniciativas da MDCA compartilhadas com o módulo Financeiro: identificador, tipo, vigência e situação.",
      },
      { property: "og:title", content: "Projetos, Serviços e Programas | Gestão MDCA" },
      {
        property: "og:description",
        content: "Entidade compartilhada entre os módulos Gestão e Financeiro.",
      },
    ],
  }),
  component: Projetos,
});

const vazio: Omit<Iniciativa, "id"> = {
  codigo: "",
  nome: "",
  tipo: "Projeto",
  inicio: "",
  fim: "",
  situacao: "Ativo",
  origem: "Compartilhado com Financeiro",
};

function Projetos() {
  const { iniciativas, salvarIniciativa } = useStore();
  const perm = usePermissoes();
  const { estado, salvar, mensagem } = useSalvar();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm, limparForm] = useRascunho("rascunho:iniciativa", vazio);

  const submeter = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const registro: Iniciativa = { id: editando ?? novoId("ini"), ...form };
    const ok = await salvar(() => salvarIniciativa(registro, !!editando));
    if (ok) {
      limparForm();
      setAberto(false);
      setEditando(null);
      setForm(vazio);
    }
  };

  return (
    <div>
      <PageHeader
        titulo="Projetos, Serviços e Programas"
        descricao="Extensão da entidade “Projeto” do módulo Financeiro. Aqui não há dados orçamentários."
        acoes={
          <div className="flex items-center gap-3">
            <SaveStatus estado={estado} />
            {perm.cadastrarIniciativa && (
            <Button
              onClick={() => {
                setEditando(null);
                setForm(vazio);
                setAberto((v) => !v);
              }}
            >
              <Plus className="size-4" /> Nova iniciativa
            </Button>
            )}
          </div>
        }
      />

      <div className="card-surface mb-4 flex items-start gap-2 p-4 text-sm text-muted-foreground">
        <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Estes registros alimentam os seletores de vínculo institucional em Educandos, Atividades
          e Fichas de Evolução, e são compartilhados com o módulo Financeiro (que mantém o
          orçamento e a prestação de contas).
        </p>
      </div>

      {mensagem && <p className="mb-3 text-sm text-destructive">{mensagem}</p>}

      {perm.cadastrarIniciativa && aberto && (
        <form onSubmit={submeter} className="card-surface mb-5 space-y-4 p-5">
          <h2 className="text-base font-semibold">
            {editando ? "Editar iniciativa" : "Cadastrar iniciativa"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">Identificador único</Label>
              <Input
                required
                placeholder="PRJ-2026-003"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Nome</Label>
              <Input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as Iniciativa["tipo"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Projeto">Projeto</SelectItem>
                  <SelectItem value="Serviço">Serviço</SelectItem>
                  <SelectItem value="Programa">Programa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Situação</Label>
              <Select
                value={form.situacao}
                onValueChange={(v) => setForm({ ...form, situacao: v as Iniciativa["situacao"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                  <SelectItem value="Encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Início da vigência</Label>
              <Input
                type="date"
                value={form.inicio ?? ""}
                onChange={(e) => setForm({ ...form, inicio: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Fim da vigência (quando aplicável)</Label>
              <Input
                type="date"
                value={form.fim ?? ""}
                onChange={(e) => setForm({ ...form, fim: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={estado === "saving"}>
              Salvar iniciativa
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
          </div>
        </form>
      )}

      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificador</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Vigência</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {iniciativas.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.codigo}</TableCell>
                <TableCell className="font-medium">
                  {i.nome}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {i.origem}
                  </span>
                </TableCell>
                <TableCell>{i.tipo}</TableCell>
                <TableCell className="text-muted-foreground">
                  {i.inicio ? i.inicio.split("-").reverse().join("/") : "—"} →{" "}
                  {i.fim ? i.fim.split("-").reverse().join("/") : "sem término"}
                </TableCell>
                <TableCell>
                  <Badge variant={i.situacao === "Ativo" ? "default" : "secondary"}>
                    {i.situacao}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {perm.cadastrarIniciativa && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditando(i.id);
                      const { id: _id, ...resto } = i;
                      setForm(resto);
                      setAberto(true);
                    }}
                  >
                    Editar
                  </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
