import { useState } from "react"
import { Link } from "react-router-dom"
import { useEducandosGestao, usePermissoesEducandos } from "./EducandosContext"
import { filtrarEducandos } from "./model"
import { Badge, Card, PageHeader, inputClass } from "./components/EducandoUi"

export default function EducandosPage() {
  const { educandos, iniciativas, iniciativaNome } = useEducandosGestao()
  const permissoes = usePermissoesEducandos()
  const [busca, setBusca] = useState("")
  const [iniciativa, setIniciativa] = useState("todas")
  const [situacao, setSituacao] = useState("todas")
  const lista = filtrarEducandos(educandos, busca, iniciativa, situacao)

  return (
    <div>
      <PageHeader
        titulo="Educandos"
        descricao="Crianças e adolescentes vinculados às iniciativas da MDCA."
        acoes={
          permissoes.editarCadastro ? (
            <Link
              to="/gestao/educandos/novo"
              className="inline-flex h-10 items-center rounded-md bg-[#0f1e3d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a3060]"
            >
              + Novo educando
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-64 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            ⌕
          </span>
          <input
            className={`${inputClass} pl-9`}
            placeholder="Buscar por nome"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
        <select
          className={`${inputClass} w-full md:w-72`}
          value={iniciativa}
          onChange={(event) => setIniciativa(event.target.value)}
          aria-label="Filtrar por iniciativa"
        >
          <option value="todas">Todas as iniciativas</option>
          {iniciativas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} w-full md:w-44`}
          value={situacao}
          onChange={(event) => setSituacao(event.target.value)}
          aria-label="Filtrar por situação"
        >
          <option value="todas">Todas as situações</option>
          <option value="Ativo">Ativos</option>
          <option value="Inativo">Inativos</option>
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Iniciativa vinculada</th>
                <th className="px-4 py-3 font-medium">Ingresso</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((educando) => (
                <tr
                  key={educando.id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{educando.nome}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {iniciativaNome(educando.iniciativaId)}
                  </td>
                  <td className="px-4 py-3">
                    {educando.dataIngresso
                      ? educando.dataIngresso.split("-").reverse().join("/")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        educando.situacaoVinculo === "Ativo"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {educando.situacaoVinculo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/gestao/educandos/${educando.id}`}
                      className="inline-flex rounded-md px-3 py-1.5 text-xs font-medium text-[#1a3a6b] transition-colors hover:bg-[var(--muted)]"
                    >
                      Abrir ficha
                    </Link>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                  >
                    Nenhum educando encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
