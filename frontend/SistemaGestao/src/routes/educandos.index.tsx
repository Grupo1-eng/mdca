import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/educandos/")({
  head: () => ({
    meta: [
      { title: "Educandos | Gestão MDCA" },
      {
        name: "description",
        content: "Lista de crianças e adolescentes atendidos, com busca por nome, iniciativa e situação.",
      },
      { property: "og:title", content: "Educandos | Gestão MDCA" },
      { property: "og:description", content: "Cadastro e acompanhamento de educandos da MDCA." },
    ],
  }),
  component: EducandosLista,
});

function EducandosLista() {
  const { educandos, iniciativas, iniciativaNome } = useStore();
  const [busca, setBusca] = useState("");
  const [iniciativa, setIniciativa] = useState("todas");
  const [situacao, setSituacao] = useState("todas");

  const lista = educandos.filter(
    (e) =>
      e.nome.toLowerCase().includes(busca.toLowerCase()) &&
      (iniciativa === "todas" || e.iniciativaId === iniciativa) &&
      (situacao === "todas" || e.situacaoVinculo === situacao),
  );

  return (
    <div>
      <PageHeader
        titulo="Educandos"
        descricao="Crianças e adolescentes vinculados às iniciativas da MDCA."
        acoes={
          <Button asChild>
            <Link to="/educandos/novo">
              <Plus className="size-4" /> Novo educando
            </Link>
          </Button>
        }
      />

      <div className="card-surface mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={iniciativa} onValueChange={setIniciativa}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Projeto / Serviço / Programa" />
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
        <Select value={situacao} onValueChange={setSituacao}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as situações</SelectItem>
            <SelectItem value="Ativo">Ativos</SelectItem>
            <SelectItem value="Inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Iniciativa vinculada</TableHead>
              <TableHead>Ingresso</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {iniciativaNome(e.iniciativaId)}
                </TableCell>
                <TableCell>{e.dataIngresso.split("-").reverse().join("/")}</TableCell>
                <TableCell>
                  <Badge variant={e.situacaoVinculo === "Ativo" ? "default" : "secondary"}>
                    {e.situacaoVinculo}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/educandos/$id" params={{ id: e.id }}>
                      Abrir ficha
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum educando encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
