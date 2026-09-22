import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import {
  MOTIVOS_INGRESSO,
  ORIGENS_ENCAMINHAMENTO,
  responsavelVazio,
  type Educando,
  type Responsavel,
} from "@/lib/mock-data";
import { duplicataDe } from "@/lib/gestao-api";
import { useRascunho } from "@/lib/rascunho";
import { novoId, usePermissoes, useSalvar, useStore } from "@/lib/store";
import { SaveStatus, SensitiveNote } from "@/components/SaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CORES = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não declarada"];

function educandoVazio(): Educando {
  return {
    id: "",
    nome: "",
    nascimento: "",
    cpf: "",
    nis: "",
    rg: "",
    corAutodeclarada: "",
    genero: "",
    endereco: "",
    telefone: "",
    iniciativaId: "",
    dataIngresso: "",
    situacaoVinculo: "Ativo",
    escola: "",
    serie: "",
    turno: "",
    repetencia: "",
    responsaveis: [responsavelVazio(novoId("resp"))],
    rendaFamiliar: "",
    pessoasCasa: 1,
    beneficios: "",
    moradia: "",
    doencaCronica: "",
    medicamentoContinuo: "",
    saudeObs: "",
    motivosIngresso: [],
    origemEncaminhamento: "",
  };
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="card-surface p-5">
      <h2 className="mb-4 text-base font-semibold">{titulo}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Campo({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : undefined}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}

export function EducandoForm({
  educando,
  leitura = false,
}: {
  educando?: Educando;
  leitura?: boolean;
}) {
  const { iniciativas, educandos, salvarEducando } = useStore();
  const perm = usePermissoes();
  const navigate = useNavigate();
  const { estado, salvar, mensagem } = useSalvar();
  const [simularFalha, setSimularFalha] = useState(false);
  const [form, setForm, limparRascunho] = useRascunho<Educando>(
    `rascunho:educando:${educando?.id || "novo"}`,
    educando ?? educandoVazio(),
  );

  const set = <K extends keyof Educando>(k: K, v: Educando[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const atualizarResponsavel = (id: string, campo: keyof Responsavel, valor: string) =>
    setForm((f) => ({
      ...f,
      responsaveis: f.responsaveis.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)),
    }));

  const duplicado = duplicataDe(educandos, form);

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (leitura || duplicado) return;
    const registro: Educando = { ...form, id: form.id || novoId("edu") };
    const ok = await salvar(() => salvarEducando(registro), simularFalha);
    if (ok) {
      limparRascunho();
      navigate({ to: "/educandos/$id", params: { id: registro.id } });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {duplicado && !leitura && (
        <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning/25 p-3 text-sm text-warning-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <strong>Possível cadastro duplicado.</strong> Já existe um educando com este CPF ou NIS (
            {duplicado.nome}). Enquanto a MDCA não decidir o contrário, o sistema impede gravar.
          </div>
        </div>
      )}
      {mensagem && <SensitiveNote>{mensagem}</SensitiveNote>}

      <Secao titulo="Dados pessoais">
        <Campo label="Nome completo" full>
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required disabled={leitura} />
        </Campo>
        <Campo label="Data de nascimento">
          <Input type="date" value={form.nascimento} onChange={(e) => set("nascimento", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Gênero">
          <Input value={form.genero} onChange={(e) => set("genero", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Cor autodeclarada">
          <Select
            {...(form.corAutodeclarada ? { value: form.corAutodeclarada } : {})}
            onValueChange={(v) => set("corAutodeclarada", v)}
            disabled={leitura}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {CORES.map((cor) => (
                <SelectItem key={cor} value={cor}>
                  {cor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="CPF">
          <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" disabled={leitura} />
        </Campo>
        <Campo label="NIS">
          <Input value={form.nis} onChange={(e) => set("nis", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="RG">
          <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Endereço" full>
          <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Telefone de contato">
          <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} disabled={leitura} />
        </Campo>
      </Secao>

      <Secao titulo="Vínculo institucional">
        <Campo label="Iniciativa vinculada (Projeto / Serviço / Programa)" full>
          <Select
            {...(form.iniciativaId ? { value: form.iniciativaId } : {})}
            onValueChange={(v) => set("iniciativaId", v)}
            disabled={leitura}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a iniciativa" />
            </SelectTrigger>
            <SelectContent>
              {iniciativas.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.codigo} · {i.nome} ({i.tipo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="Data de ingresso">
          <Input type="date" value={form.dataIngresso} onChange={(e) => set("dataIngresso", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Situação do vínculo">
          <Input value={form.situacaoVinculo} disabled />
        </Campo>
      </Secao>

      <Secao titulo="Dados escolares">
        <Campo label="Escola">
          <Input value={form.escola} onChange={(e) => set("escola", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Série / ano">
          <Input value={form.serie} onChange={(e) => set("serie", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Turno">
          <Input value={form.turno} onChange={(e) => set("turno", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Histórico de repetência" full>
          <Input value={form.repetencia} onChange={(e) => set("repetencia", e.target.value)} disabled={leitura} />
        </Campo>
      </Secao>

      <section className="card-surface space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Responsáveis familiares</h2>
          {!leitura && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set("responsaveis", [...form.responsaveis, responsavelVazio(novoId("resp"))])}
            >
              <Plus className="size-4" /> Adicionar responsável
            </Button>
          )}
        </div>
        {form.responsaveis.map((responsavel, indice) => (
          <div key={responsavel.id || indice} className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
            <Campo label="Nome">
              <Input value={responsavel.nome} onChange={(e) => atualizarResponsavel(responsavel.id, "nome", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="Vínculo">
              <Input value={responsavel.vinculo} onChange={(e) => atualizarResponsavel(responsavel.id, "vinculo", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="CPF">
              <Input value={responsavel.cpf} onChange={(e) => atualizarResponsavel(responsavel.id, "cpf", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="RG">
              <Input value={responsavel.rg} onChange={(e) => atualizarResponsavel(responsavel.id, "rg", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="Telefone">
              <Input value={responsavel.telefone} onChange={(e) => atualizarResponsavel(responsavel.id, "telefone", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="Profissão">
              <Input value={responsavel.profissao} onChange={(e) => atualizarResponsavel(responsavel.id, "profissao", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="Tipo de trabalho">
              <Input value={responsavel.tipoTrabalho} onChange={(e) => atualizarResponsavel(responsavel.id, "tipoTrabalho", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="Local de trabalho">
              <Input value={responsavel.localTrabalho} onChange={(e) => atualizarResponsavel(responsavel.id, "localTrabalho", e.target.value)} disabled={leitura} />
            </Campo>
            <Campo label="Escolaridade" full>
              <Input value={responsavel.escolaridade} onChange={(e) => atualizarResponsavel(responsavel.id, "escolaridade", e.target.value)} disabled={leitura} />
            </Campo>
            {!leitura && form.responsaveis.length > 1 && (
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    set(
                      "responsaveis",
                      form.responsaveis.filter((r) => r.id !== responsavel.id),
                    )
                  }
                >
                  <Trash2 className="size-4" /> Remover responsável
                </Button>
              </div>
            )}
          </div>
        ))}
      </section>

      <Secao titulo="Situação socioeconômica">
        <Campo label="Renda familiar">
          <Input value={form.rendaFamiliar} onChange={(e) => set("rendaFamiliar", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Pessoas na residência">
          <Input type="number" min={1} value={form.pessoasCasa} onChange={(e) => set("pessoasCasa", Number(e.target.value))} disabled={leitura} />
        </Campo>
        <Campo label="Benefícios recebidos">
          <Input value={form.beneficios} onChange={(e) => set("beneficios", e.target.value)} disabled={leitura} />
        </Campo>
        <Campo label="Tipo de moradia">
          <Input value={form.moradia} onChange={(e) => set("moradia", e.target.value)} disabled={leitura} />
        </Campo>
      </Secao>

      <section className="card-surface p-5">
        <h2 className="mb-3 text-base font-semibold">Saúde (informação sensível)</h2>
        {perm.verSaude && !leitura ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SensitiveNote>
              Campos de acesso restrito: visíveis apenas para Coordenação e equipe técnica.
            </SensitiveNote>
            <Campo label="Doença crônica">
              <Input value={form.doencaCronica} onChange={(e) => set("doencaCronica", e.target.value)} />
            </Campo>
            <Campo label="Uso contínuo de medicamento">
              <Input value={form.medicamentoContinuo} onChange={(e) => set("medicamentoContinuo", e.target.value)} />
            </Campo>
            <Campo label="Observações" full>
              <Textarea rows={3} value={form.saudeObs} onChange={(e) => set("saudeObs", e.target.value)} />
            </Campo>
          </div>
        ) : perm.verSaude && leitura ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Doença crônica">
              <Input value={form.doencaCronica} disabled />
            </Campo>
            <Campo label="Uso contínuo de medicamento">
              <Input value={form.medicamentoContinuo} disabled />
            </Campo>
            <Campo label="Observações" full>
              <Textarea rows={3} value={form.saudeObs} disabled />
            </Campo>
          </div>
        ) : (
          <SensitiveNote>
            Conteúdo restrito — seu perfil atual não tem permissão para visualizar ou editar as informações de saúde.
          </SensitiveNote>
        )}
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-4 text-base font-semibold">Ingresso e encaminhamento</h2>
        <Label className="mb-2 block text-sm">Motivo de ingresso (múltipla escolha)</Label>
        <div className="grid gap-2 md:grid-cols-2">
          {MOTIVOS_INGRESSO.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.motivosIngresso.includes(m)}
                disabled={leitura}
                onCheckedChange={(c) =>
                  set(
                    "motivosIngresso",
                    c ? [...form.motivosIngresso, m] : form.motivosIngresso.filter((x) => x !== m),
                  )
                }
              />
              {m}
            </label>
          ))}
        </div>
        <div className="mt-4 max-w-md">
          <Label className="mb-1.5 block text-sm">Origem do encaminhamento</Label>
          <Select
            {...(form.origemEncaminhamento ? { value: form.origemEncaminhamento } : {})}
            onValueChange={(v) => set("origemEncaminhamento", v)}
            disabled={leitura}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a origem" />
            </SelectTrigger>
            <SelectContent>
              {ORIGENS_ENCAMINHAMENTO.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {!leitura && (
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={estado === "saving" || !!duplicado}>
            {educando ? "Salvar alterações" : "Cadastrar educando"}
          </Button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={simularFalha} onCheckedChange={(c) => setSimularFalha(!!c)} />
            Simular falha de envio
          </label>
          <SaveStatus estado={estado} />
        </div>
      )}
    </form>
  );
}
