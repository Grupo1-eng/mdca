import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SaveStatus, SensitiveNote } from "@/components/SaveStatus";
import { novoId, usePermissoes, useSalvar, useStore } from "@/lib/store";
import { PERFIS, type PerfilId, type Usuario } from "@/lib/mock-data";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/acessos")({
  head: () => ({
    meta: [
      { title: "Configurações de Acesso | Gestão MDCA" },
      {
        name: "description",
        content: "Gestão de usuários, perfis de acesso e log de auditoria do sistema da MDCA.",
      },
      { property: "og:title", content: "Configurações de Acesso | Gestão MDCA" },
      { property: "og:description", content: "Usuários, perfis e auditoria — restrito à Coordenação." },
    ],
  }),
  component: Acessos,
});

const nomePerfil = (p: PerfilId) => PERFIS.find((x) => x.id === p)?.nome ?? p;

function Acessos() {
  const { usuarios, setUsuarios, logs } = useStore();
  const perm = usePermissoes();
  const { estado, salvar } = useSalvar();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    perfil: "educador" as PerfilId,
    organizacao: "MDCA – Sede",
  });

  if (!perm.verConfiguracoes) {
    return (
      <div className="max-w-2xl">
        <PageHeader titulo="Configurações de Acesso" />
        <SensitiveNote>Área restrita ao perfil Coordenação.</SensitiveNote>
      </div>
    );
  }

  const criar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const registro: Usuario = { id: novoId("usr"), situacao: "Ativo", ...form };
    const ok = await salvar(() => setUsuarios((l) => [...l, registro]));
    if (ok) {
      setAberto(false);
      setForm({ ...form, nome: "", email: "" });
    }
  };

  const alterarPerfil = (id: string, perfil: PerfilId) =>
    salvar(() => setUsuarios((l) => l.map((u) => (u.id === id ? { ...u, perfil } : u))));

  const alternarSituacao = (id: string) =>
    salvar(() =>
      setUsuarios((l) =>
        l.map((u) =>
          u.id === id ? { ...u, situacao: u.situacao === "Ativo" ? "Inativo" : "Ativo" } : u,
        ),
      ),
    );

  return (
    <div>
      <PageHeader
        titulo="Configurações de Acesso"
        descricao="Usuários da organização — entidade compartilhada com o módulo Financeiro."
        acoes={
          <div className="flex items-center gap-3">
            <SaveStatus estado={estado} />
            <Button onClick={() => setAberto((v) => !v)}>
              <Plus className="size-4" /> Novo usuário
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="auditoria">Log de auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          {aberto && (
            <form onSubmit={criar} className="card-surface mb-5 space-y-4 p-5">
              <h2 className="text-base font-semibold">Criar usuário</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">Nome</Label>
                  <Input
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">E-mail</Label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Perfil</Label>
                  <Select
                    value={form.perfil}
                    onValueChange={(v) => setForm({ ...form, perfil: v as PerfilId })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFIS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Organização</Label>
                  <Input
                    value={form.organizacao}
                    onChange={(e) => setForm({ ...form, organizacao: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={estado === "saving"}>
                  Criar usuário
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          <div className="card-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.perfil}
                        onValueChange={(v) => alterarPerfil(u.id, v as PerfilId)}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue>{nomePerfil(u.perfil)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PERFIS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.situacao === "Ativo" ? "default" : "secondary"}>
                        {u.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => alternarSituacao(u.id)}>
                        {u.situacao === "Ativo" ? "Inativar" : "Reativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Registro somente leitura das ações realizadas no sistema (dados mock).
          </p>
          <div className="card-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso afetado</TableHead>
                  <TableHead>Data e hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.usuario}</TableCell>
                    <TableCell>{l.acao}</TableCell>
                    <TableCell className="text-muted-foreground">{l.recurso}</TableCell>
                    <TableCell>{l.dataHora}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
