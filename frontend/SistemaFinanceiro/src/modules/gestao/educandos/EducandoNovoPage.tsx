import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useEducandosGestao, usePermissoesEducandos } from "./EducandosContext"
import EducandoForm from "./components/EducandoForm"
import { PageHeader, SensitiveNote } from "./components/EducandoUi"

export default function EducandoNovoPage() {
  const permissoes = usePermissoesEducandos()
  const { carregarEducandos } = useEducandosGestao()

  // A lista é usada para avisar de CPF/NIS duplicado antes de enviar.
  useEffect(() => {
    carregarEducandos()
  }, [carregarEducandos])

  return (
    <div className="max-w-4xl">
      <Link
        to="/gestao/educandos"
        className="mb-3 inline-flex text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        ← Voltar para Educandos
      </Link>
      <PageHeader
        titulo="Novo educando"
        descricao="Preencha os dados do cadastro. CPF ou NIS já existentes impedem gravar."
      />
      {permissoes.editarCadastro ? (
        <EducandoForm />
      ) : (
        <SensitiveNote>Seu perfil não pode cadastrar educandos.</SensitiveNote>
      )}
    </div>
  )
}
