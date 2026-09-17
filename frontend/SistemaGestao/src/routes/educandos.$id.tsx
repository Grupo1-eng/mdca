import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, UserMinus, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { EducandoForm } from "@/components/EducandoForm";
import { EvolucaoPanel } from "@/components/EvolucaoPanel";
import { FrequenciaPanel } from "@/components/FrequenciaPanel";
import { SaveStatus } from "@/components/SaveStatus";
import { useSalvar, useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/educandos/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do educando | Gestão MDCA" },
      {
        name: "description",
        content: "Ficha completa do educando: cadastro, evoluções e histórico de frequência.",
      },
      { property: "og:title", content: "Ficha do educando | Gestão MDCA" },
      { property: "og:description", content: "Cadastro, atendimentos e frequência do educando." },
    ],
  }),
  component: EducandoDetalhe,
});

function EducandoDetalhe() {
  const { id } = useParams({ from: "/educandos/$id" });
  const { educandos, setEducandos, iniciativaNome } = useStore();
  const { estado, salvar } = useSalvar();
  const educando = educandos.find((e) => e.id === id);

  if (!educando) {
    return (
      <div className="card-surface p-6">
        <p className="text-sm">Educando não encontrado.</p>
        <Button variant="link" asChild className="px-0">
          <Link to="/educandos">Voltar para a lista</Link>
        </Button>
      </div>
    );
  }

  const alternarSituacao = () =>
    salvar(() =>
      setEducandos((lista) =>
        lista.map((e) =>
          e.id === educando.id
            ? { ...e, situacaoVinculo: e.situacaoVinculo === "Ativo" ? "Inativo" : "Ativo" }
            : e,
        ),
      ),
    );

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link to="/educandos">
          <ArrowLeft className="size-4" /> Educandos
        </Link>
      </Button>

      <PageHeader
        titulo={educando.nome}
        descricao={`${iniciativaNome(educando.iniciativaId)} · ingresso em ${educando.dataIngresso
          .split("-")
          .reverse()
          .join("/")}`}
        acoes={
          <div className="flex items-center gap-3">
            <SaveStatus estado={estado} />
            <Badge variant={educando.situacaoVinculo === "Ativo" ? "default" : "secondary"}>
              {educando.situacaoVinculo}
            </Badge>
            <Button variant="outline" onClick={alternarSituacao} disabled={estado === "saving"}>
              {educando.situacaoVinculo === "Ativo" ? (
                <>
                  <UserMinus className="size-4" /> Inativar educando
                </>
              ) : (
                <>
                  <UserCheck className="size-4" /> Reativar educando
                </>
              )}
            </Button>
          </div>
        }
      />

      {educando.situacaoVinculo === "Inativo" && (
        <p className="mb-4 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
          Educando inativo. O registro nunca é excluído — todo o histórico de atendimentos e
          frequência continua acessível.
        </p>
      )}

      <Tabs defaultValue="cadastro">
        <TabsList>
          <TabsTrigger value="cadastro">Ficha cadastral</TabsTrigger>
          <TabsTrigger value="evolucao">Fichas de evolução</TabsTrigger>
          <TabsTrigger value="frequencia">Histórico de frequência</TabsTrigger>
        </TabsList>
        <TabsContent value="cadastro" className="mt-4 max-w-4xl">
          <EducandoForm educando={educando} />
        </TabsContent>
        <TabsContent value="evolucao" className="mt-4 max-w-4xl">
          <EvolucaoPanel educandoId={educando.id} />
        </TabsContent>
        <TabsContent value="frequencia" className="mt-4">
          <FrequenciaPanel educandoId={educando.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
