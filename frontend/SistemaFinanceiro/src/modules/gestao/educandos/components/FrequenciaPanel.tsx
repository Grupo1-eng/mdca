import { useEducandosGestao } from "../EducandosContext"
import { Badge, Card } from "./EducandoUi"

export default function FrequenciaPanel({
  educandoId,
}: {
  educandoId: string
}) {
  const { encontros, atividades, iniciativaNome } = useEducandosGestao()
  const registros = [...encontros]
    .filter((encontro) =>
      encontro.presencas.some((presenca) => presenca.educandoId === educandoId),
    )
    .sort((a, b) => b.data.localeCompare(a.data))
  const realizados = registros.filter(
    (encontro) => encontro.situacao === "Realizado",
  )
  const presentes = realizados.filter(
    (encontro) =>
      encontro.presencas.find((presenca) => presenca.educandoId === educandoId)
        ?.presente,
  ).length
  const taxa = realizados.length
    ? Math.round((presentes / realizados.length) * 100)
    : 0

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Frequência nos encontros realizados
        </p>
        <p className="mt-1 text-2xl font-semibold">
          {taxa}%{" "}
          <span className="text-sm font-normal text-[var(--muted-foreground)]">
            ({presentes} de {realizados.length})
          </span>
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Atividade</th>
                <th className="px-4 py-3 font-medium">Iniciativa</th>
                <th className="px-4 py-3 font-medium">Situação do encontro</th>
                <th className="px-4 py-3 font-medium">Presença</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((encontro) => {
                const atividade = atividades.find(
                  (item) => item.id === encontro.atividadeId,
                )
                const presente = encontro.presencas.find(
                  (presenca) => presenca.educandoId === educandoId,
                )?.presente
                return (
                  <tr
                    key={encontro.id}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      {encontro.data.split("-").reverse().join("/")}
                    </td>
                    <td className="px-4 py-3">{atividade?.nome ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {atividade ? iniciativaNome(atividade.iniciativaId) : "—"}
                    </td>
                    <td className="px-4 py-3">{encontro.situacao}</td>
                    <td className="px-4 py-3">
                      <Badge variant={presente ? "default" : "secondary"}>
                        {presente ? "Presente" : "Ausente"}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {registros.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                  >
                    Nenhum registro de frequência para este educando.
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
