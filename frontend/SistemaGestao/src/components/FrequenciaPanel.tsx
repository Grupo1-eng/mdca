import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function FrequenciaPanel({ educandoId }: { educandoId: string }) {
  const { encontros, atividades, iniciativaNome } = useStore();

  const registros = encontros
    .filter((e) => e.presencas.some((p) => p.educandoId === educandoId))
    .sort((a, b) => b.data.localeCompare(a.data));

  const realizados = registros.filter((e) => e.situacao === "Realizado");
  const presentes = realizados.filter(
    (e) => e.presencas.find((p) => p.educandoId === educandoId)?.presente,
  ).length;
  const taxa = realizados.length ? Math.round((presentes / realizados.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <p className="text-sm text-muted-foreground">Frequência nos encontros realizados</p>
        <p className="mt-1 text-2xl font-semibold">
          {taxa}% <span className="text-sm font-normal text-muted-foreground">({presentes} de {realizados.length})</span>
        </p>
      </div>
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead>Iniciativa</TableHead>
              <TableHead>Situação do encontro</TableHead>
              <TableHead>Presença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((e) => {
              const atv = atividades.find((a) => a.id === e.atividadeId);
              const presente = e.presencas.find((p) => p.educandoId === educandoId)?.presente;
              return (
                <TableRow key={e.id}>
                  <TableCell>{e.data.split("-").reverse().join("/")}</TableCell>
                  <TableCell>{atv?.nome ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {atv ? iniciativaNome(atv.iniciativaId) : "—"}
                  </TableCell>
                  <TableCell>{e.situacao}</TableCell>
                  <TableCell>
                    <Badge variant={presente ? "default" : "secondary"}>
                      {presente ? "Presente" : "Ausente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {registros.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum registro de frequência para este educando.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
