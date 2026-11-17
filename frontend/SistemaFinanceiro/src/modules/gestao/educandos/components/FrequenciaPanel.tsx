import { useEffect, useState } from "react"
import { ErrorState, LoadingState } from "@/components/StatusMessage"
import { historicoFrequencia } from "../../api/atividades"
import { resumoFrequencia } from "../../api/atividadesMapper"
import { ehIdPersistido } from "../../api/educandosMapper"
import { dataVisivel } from "../../atividades/model"
import type { RegistroFrequencia } from "../types"
import { Badge, Card, SensitiveNote } from "./EducandoUi"

// Histórico de frequência do educando (RF19), da API real.
export default function FrequenciaPanel({ educandoId }: { educandoId: string }) {
  const persistido = ehIdPersistido(educandoId)
  const [registros, setRegistros] = useState<RegistroFrequencia[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!persistido) return
    setRegistros(null)
    setErro(null)
    historicoFrequencia(educandoId)
      .then(setRegistros)
      .catch((falha: unknown) =>
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar a frequência."),
      )
  }, [educandoId, persistido])

  if (!persistido) {
    return <SensitiveNote>Salve o cadastro do educando para registrar a frequência.</SensitiveNote>
  }
  if (erro) return <ErrorState message={erro} />
  if (!registros) return <LoadingState label="Carregando frequência" />

  const { realizados, presentes, taxa } = resumoFrequencia(registros)

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Frequência nos encontros realizados
        </p>
        <p className="mt-1 text-2xl font-semibold">
          {taxa === null ? "—" : `${taxa}%`}{" "}
          <span className="text-sm font-normal text-[var(--muted-foreground)]">
            ({presentes} de {realizados})
          </span>
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Encontros cancelados ou ainda planejados não entram na taxa.
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
              {registros.map((registro) => (
                <tr key={registro.encontroId} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">
                    {dataVisivel(registro.data)}
                    {registro.horaInicio && (
                      <span className="text-[var(--muted-foreground)]"> {registro.horaInicio}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{registro.atividadeNome}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{registro.iniciativaNome}</td>
                  <td className="px-4 py-3">{registro.situacaoEncontro}</td>
                  <td className="px-4 py-3">
                    <Badge variant={registro.presente ? "default" : "secondary"}>
                      {registro.presente ? "Presente" : "Ausente"}
                    </Badge>
                    {registro.observacao && (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{registro.observacao}</p>
                    )}
                  </td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">
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
