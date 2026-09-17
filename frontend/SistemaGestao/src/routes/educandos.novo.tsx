import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { EducandoForm } from "@/components/EducandoForm";

export const Route = createFileRoute("/educandos/novo")({
  head: () => ({
    meta: [
      { title: "Novo educando | Gestão MDCA" },
      {
        name: "description",
        content: "Formulário de cadastro de educando com dados pessoais, escolares e socioeconômicos.",
      },
      { property: "og:title", content: "Novo educando | Gestão MDCA" },
      { property: "og:description", content: "Cadastro de criança ou adolescente na MDCA." },
    ],
  }),
  component: NovoEducando,
});

function NovoEducando() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        titulo="Novo educando"
        descricao="Preencha os dados do cadastro. O sistema avisa sobre possíveis duplicidades de CPF/NIS."
      />
      <EducandoForm />
    </div>
  );
}
