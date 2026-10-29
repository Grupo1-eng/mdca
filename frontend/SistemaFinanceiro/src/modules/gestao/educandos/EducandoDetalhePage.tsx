import { useEffect, useState } from "react"
import { ErrorState, LoadingState } from "@/components/StatusMessage"
import { Link, useParams } from "react-router-dom"
import {
  useEducandosGestao,
  usePermissoesEducandos,
  useSalvarGestao,
} from "./EducandosContext"
import EducandoForm from "./components/EducandoForm"
import EvolucaoPanel from "./components/EvolucaoPanel"
import FrequenciaPanel from "./components/FrequenciaPanel"
import {
  Badge,
  Card,
  PageHeader,
  SaveStatus,
  SensitiveNote,
} from "./components/EducandoUi"

type Aba = "cadastro" | "evolucao" | "frequencia"

export default function EducandoDetalhePage() {
  const { id = "" } = useParams()
  const {
    educandos,
    iniciativaNome,
    alternarSituacaoEducando,
    cargaEducandos,
    erroEducandos,
    carregarEducandos,
    carregarEducando,
  } = useEducandosGestao()
  const permissoes = usePermissoesEducandos()
  const { estado, mensagem, salvar } = useSalvarGestao()
  const [aba, setAba] = useState<Aba>(
    permissoes.verCadastro ? "cadastro" : "frequencia",
  )
  const educando = educandos.find((item) => item.id === id)
  const [erroFicha, setErroFicha] = useState<string | null>(null)
  // O formulário guarda o estado inicial; só é montado com a ficha completa,
  // senão abriria sem os responsáveis (a listagem não os traz).
  const [fichaPronta, setFichaPronta] = useState(!permissoes.verFichaCompleta)

  useEffect(() => {
    carregarEducandos()
  }, [carregarEducandos])

  // GET /api/educandos/:id (com responsáveis) é restrito à equipe técnica e à
  // coordenação; os demais perfis ficam com os dados da listagem.
  useEffect(() => {
    if (!permissoes.verFichaCompleta) return
    let cancelado = false
    setErroFicha(null)
    setFichaPronta(false)
    carregarEducando(id)
      .then(() => {
        if (!cancelado) setFichaPronta(true)
      })
      .catch((erro: unknown) => {
        if (cancelado) return
        setErroFicha(
          erro instanceof Error
            ? erro.message
            : "Não foi possível abrir a ficha.",
        )
      })
    return () => {
      cancelado = true
    }
  }, [id, permissoes.verFichaCompleta, carregarEducando])

  if (!educando && (cargaEducandos === "ociosa" || cargaEducandos === "carregando")) {
    return <LoadingState label="Carregando ficha…" />
  }

  if (!educando && cargaEducandos === "erro") {
    return <ErrorState message={erroEducandos ?? "Não foi possível carregar os educandos."} />
  }

  if (!educando) {
    return (
      <Card className="p-6">
        <p className="text-sm">Educando não encontrado.</p>
        <Link
          to="/gestao/educandos"
          className="mt-3 inline-block text-sm text-[#1a3a6b] hover:underline"
        >
          Voltar para a lista
        </Link>
      </Card>
    )
  }

  const alternarSituacao = () =>
    salvar(() => alternarSituacaoEducando(educando.id))
  const abas: Array<{
    id: Aba
    label: string
    visivel: boolean
  }> = [
    {
      id: "cadastro",
      label: "Ficha cadastral",
      visivel: permissoes.verCadastro || permissoes.verFichaCompleta,
    },
    {
      id: "evolucao",
      label: "Fichas de evolução",
      visivel: permissoes.verEvolucao,
    },
    { id: "frequencia", label: "Histórico de frequência", visivel: true },
  ]

  return (
    <div>
      <Link
        to="/gestao/educandos"
        className="mb-3 inline-flex text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        ← Educandos
      </Link>

      <PageHeader
        titulo={educando.nome}
        descricao={`${iniciativaNome(educando.iniciativaId)} · ingresso em ${
          educando.dataIngresso
            ? educando.dataIngresso.split("-").reverse().join("/")
            : "data não informada"
        }`}
        acoes={
          <>
            <SaveStatus estado={estado} />
            <Badge
              variant={
                educando.situacaoVinculo === "Ativo" ? "default" : "secondary"
              }
            >
              {educando.situacaoVinculo}
            </Badge>
            {permissoes.inativarEducando && (
              <button
                type="button"
                onClick={alternarSituacao}
                disabled={estado === "saving"}
                className="inline-flex h-9 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium hover:bg-[var(--muted)] disabled:opacity-50"
              >
                {educando.situacaoVinculo === "Ativo"
                  ? "Inativar educando"
                  : "Reativar educando"}
              </button>
            )}
          </>
        }
      />

      {erroFicha && (
        <div className="mb-4">
          <ErrorState message={erroFicha} />
        </div>
      )}

      {mensagem && (
        <div className="mb-4">
          <SensitiveNote>{mensagem}</SensitiveNote>
        </div>
      )}

      {educando.situacaoVinculo === "Inativo" && (
        <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
          Educando inativo. O registro nunca é excluído — todo o histórico de
          atendimentos e frequência continua acessível.
        </p>
      )}

      {!permissoes.verCadastro && !permissoes.verFichaCompleta ? (
        <div className="space-y-4">
          <SensitiveNote>
            A ficha técnica não está disponível para este perfil. O histórico de
            frequência segue abaixo.
          </SensitiveNote>
          <FrequenciaPanel educandoId={educando.id} />
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap gap-1 border-b border-[var(--border)]">
            {abas
              .filter((item) => item.visivel)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAba(item.id)}
                  className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    aba === item.id
                      ? "border-[#0e7e6e] text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
          </div>

          {aba === "cadastro" && (
            <div className="max-w-4xl">
              {fichaPronta ? (
                <EducandoForm
                  key={educando.id}
                  educando={educando}
                  leitura={!permissoes.editarCadastro}
                />
              ) : erroFicha ? null : (
                <LoadingState label="Carregando ficha cadastral…" />
              )}
            </div>
          )}
          {aba === "evolucao" && permissoes.verEvolucao && (
            <div className="max-w-4xl">
              <EvolucaoPanel educandoId={educando.id} />
            </div>
          )}
          {aba === "frequencia" && <FrequenciaPanel educandoId={educando.id} />}
        </div>
      )}
    </div>
  )
}
