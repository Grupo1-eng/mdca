import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import {
  MOTIVOS_INGRESSO,
  ORIGENS_ENCAMINHAMENTO,
  type Educando,
} from "@/lib/mock-data";
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

const vazio: Educando = {
  id: "",
  nome: "",
  nascimento: "",
  cpf: "",
  nis: "",
  genero: "",
  endereco: "",
  telefone: "",
  iniciativaId: "",
  dataIngresso: "",
  situacaoVinculo: "Ativo",
  escola: "",
  serie: "",
  turno: "",
  responsavelNome: "",
  responsavelParentesco: "",
  responsavelTelefone: "",
  rendaFamiliar: "",
  pessoasCasa: 1,
  beneficios: "",
  moradia: "",
  saudeObs: "",
  motivosIngresso: [],
  origemEncaminhamento: "",
};

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

export function EducandoForm({ educando }: { educando?: Educando }) {
  const { iniciativas, setEducandos, educandos } = useStore();
  const perm = usePermissoes();
  const navigate = useNavigate();
  const { estado, salvar } = useSalvar();
  const [form, setForm] = useState<Educando>(educando ?? vazio);

  const set = <K extends keyof Educando>(k: K, v: Educando[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const duplicado =
    (form.cpf.length >= 11 || form.nis.length >= 10) &&
    educandos.some(
      (e) => e.id !== form.id && (e.cpf === form.cpf || (!!form.nis && e.nis === form.nis)),
    );

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const registro: Educando = { ...form, id: form.id || novoId("edu") };
    const ok = await salvar(() => {
      setEducandos((lista) =>
        lista.some((e) => e.id === registro.id)
          ? lista.map((e) => (e.id === registro.id ? registro : e))
          : [...lista, registro],
      );
    });
    if (ok) navigate({ to: "/educandos/$id", params: { id: registro.id } });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {duplicado && (
        <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning/25 p-3 text-sm text-warning-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <strong>Possível cadastro duplicado.</strong> Já existe um educando com este CPF/NIS.
            Verifique antes de confirmar — você ainda pode salvar este registro.
          </div>
        </div>
      )}

      <Secao titulo="Dados pessoais">
        <Campo label="Nome completo" full>
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
        </Campo>
        <Campo label="Data de nascimento">
          <Input
            type="date"
            value={form.nascimento}
            onChange={(e) => set("nascimento", e.target.value)}
          />
        </Campo>
        <Campo label="Gênero">
          <Input value={form.genero} onChange={(e) => set("genero", e.target.value)} />
        </Campo>
        <Campo label="CPF">
          <Input
            value={form.cpf}
            onChange={(e) => set("cpf", e.target.value)}
            placeholder="000.000.000-00"
          />
        </Campo>
        <Campo label="NIS">
          <Input value={form.nis} onChange={(e) => set("nis", e.target.value)} />
        </Campo>
        <Campo label="Endereço" full>
          <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
        </Campo>
        <Campo label="Telefone de contato">
          <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
        </Campo>
      </Secao>

      <Secao titulo="Vínculo institucional">
        <Campo label="Iniciativa vinculada (Projeto / Serviço / Programa)" full>
          <Select value={form.iniciativaId} onValueChange={(v) => set("iniciativaId", v)}>
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
          <p className="mt-1 text-xs text-muted-foreground">
            Lista compartilhada com o módulo Financeiro.
          </p>
        </Campo>
        <Campo label="Data de ingresso">
          <Input
            type="date"
            value={form.dataIngresso}
            onChange={(e) => set("dataIngresso", e.target.value)}
          />
        </Campo>
        <Campo label="Situação do vínculo">
          <Select
            value={form.situacaoVinculo}
            onValueChange={(v) => set("situacaoVinculo", v as Educando["situacaoVinculo"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </Campo>
      </Secao>

      <Secao titulo="Dados escolares">
        <Campo label="Escola">
          <Input value={form.escola} onChange={(e) => set("escola", e.target.value)} />
        </Campo>
        <Campo label="Série / ano">
          <Input value={form.serie} onChange={(e) => set("serie", e.target.value)} />
        </Campo>
        <Campo label="Turno">
          <Input value={form.turno} onChange={(e) => set("turno", e.target.value)} />
        </Campo>
      </Secao>

      <Secao titulo="Responsável familiar">
        <Campo label="Nome do responsável">
          <Input
            value={form.responsavelNome}
            onChange={(e) => set("responsavelNome", e.target.value)}
          />
        </Campo>
        <Campo label="Parentesco">
          <Input
            value={form.responsavelParentesco}
            onChange={(e) => set("responsavelParentesco", e.target.value)}
          />
        </Campo>
        <Campo label="Telefone">
          <Input
            value={form.responsavelTelefone}
            onChange={(e) => set("responsavelTelefone", e.target.value)}
          />
        </Campo>
      </Secao>

      <Secao titulo="Situação socioeconômica">
        <Campo label="Renda familiar">
          <Input
            value={form.rendaFamiliar}
            onChange={(e) => set("rendaFamiliar", e.target.value)}
          />
        </Campo>
        <Campo label="Pessoas na residência">
          <Input
            type="number"
            min={1}
            value={form.pessoasCasa}
            onChange={(e) => set("pessoasCasa", Number(e.target.value))}
          />
        </Campo>
        <Campo label="Benefícios recebidos">
          <Input value={form.beneficios} onChange={(e) => set("beneficios", e.target.value)} />
        </Campo>
        <Campo label="Tipo de moradia">
          <Input value={form.moradia} onChange={(e) => set("moradia", e.target.value)} />
        </Campo>
      </Secao>

      <section className="card-surface p-5">
        <h2 className="mb-3 text-base font-semibold">Saúde (informação sensível)</h2>
        {perm.verSigiloso ? (
          <div className="space-y-2">
            <SensitiveNote>
              Campo de acesso restrito: visível apenas para Coordenação e equipe técnica.
            </SensitiveNote>
            <Textarea
              rows={3}
              value={form.saudeObs}
              onChange={(e) => set("saudeObs", e.target.value)}
            />
          </div>
        ) : (
          <SensitiveNote>
            Conteúdo restrito — seu perfil atual não tem permissão para visualizar ou editar as
            informações de saúde.
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
                onCheckedChange={(c) =>
                  set(
                    "motivosIngresso",
                    c
                      ? [...form.motivosIngresso, m]
                      : form.motivosIngresso.filter((x) => x !== m),
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
            value={form.origemEncaminhamento}
            onValueChange={(v) => set("origemEncaminhamento", v)}
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

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={estado === "saving"}>
          {educando ? "Salvar alterações" : "Cadastrar educando"}
        </Button>
        <SaveStatus estado={estado} />
      </div>
    </form>
  );
}
