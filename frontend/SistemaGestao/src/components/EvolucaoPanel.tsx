import { useState } from "react";
import { CalendarClock, ChevronDown, Lock, Plus, UserRound } from "lucide-react";
import { novoId, usePermissoes, useSalvar, useStore } from "@/lib/store";
import { useRascunho } from "@/lib/rascunho";
import {
  situacaoAtualEncaminhamento,
  type Atendimento,
  type Encaminhamento,
  type StatusEncaminhamento,
} from "@/lib/mock-data";
import { SaveStatus, SensitiveNote } from "@/components/SaveStatus";
import { Badge } from "@/components/ui/badge";
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

const STATUS: StatusEncaminhamento[] = ["Pendente", "Em andamento", "Efetivado"];

function badgeStatus(s: StatusEncaminhamento) {
  return s === "Efetivado" ? "default" : s === "Em andamento" ? "secondary" : "outline";
}

function formatarDataHora(v: string) {
  const [d, h] = v.split("T");
  return `${(d ?? "").split("-").reverse().join("/")}${h ? ` às ${h.slice(0, 5)}` : ""}`;
}

export function EvolucaoPanel({ educandoId }: { educandoId: string }) {
  const { atendimentos, encaminhamentos, usuario, nomePerfil, registrarEvolucao, registrarEncaminhamento } =
    useStore();
  const perm = usePermissoes();
  const { estado, salvar, mensagem } = useSalvar();
  const [aberto, setAberto] = useState(false);
  const [novoEnc, setNovoEnc] = useState(false);

  const [form, setForm, limparForm] = useRascunho(`rascunho:evolucao:${educandoId}`, {
    dataHora: new Date().toISOString().slice(0, 16),
    registro: "",
    intervencaoUsuario: "",
    intervencaoFamilia: "",
    sigiloso: true,
  });
  const [formEnc, setFormEnc, limparEnc] = useRascunho(`rascunho:encaminhamento:${educandoId}`, {
    destino: "",
    motivo: "",
  });

  if (!perm.verEvolucao) {
    return (
      <SensitiveNote>
        As fichas de evolução não estão disponíveis para este perfil.
      </SensitiveNote>
    );
  }

  const profissional = usuario?.nome ?? "";
  const perfilProfissional = usuario ? nomePerfil(usuario.perfil) : "";

  const linha = [
    ...atendimentos
      .filter((a) => a.educandoId === educandoId)
      .map((a) => ({ tipo: "atendimento" as const, data: a.dataHora, item: a })),
    ...encaminhamentos
      .filter((e) => e.educandoId === educandoId)
      .map((e) => ({ tipo: "encaminhamento" as const, data: e.dataHora, item: e })),
  ].sort((a, b) => b.data.localeCompare(a.data));

  const salvarAtendimento = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const registro: Atendimento = {
      id: novoId("at"),
      educandoId,
      profissional,
      perfilProfissional,
      ...form,
    };
    const ok = await salvar(() => registrarEvolucao(registro));
    if (ok) {
      limparForm();
      setAberto(false);
      setForm({ ...form, registro: "", intervencaoUsuario: "", intervencaoFamilia: "" });
    }
  };

  const salvarEncaminhamento = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const registro: Encaminhamento = {
      id: novoId("enc"),
      educandoId,
      profissional,
      dataHora: new Date().toISOString().slice(0, 16),
      destino: formEnc.destino,
      motivo: formEnc.motivo,
      acompanhamentos: [],
    };
    const ok = await salvar(() => registrarEncaminhamento(registro));
    if (ok) {
      limparEnc();
      setNovoEnc(false);
      setFormEnc({ destino: "", motivo: "" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setAberto((v) => !v)}>
          <Plus className="size-4" /> Novo atendimento
        </Button>
        <Button variant="outline" onClick={() => setNovoEnc((v) => !v)}>
          <Plus className="size-4" /> Novo encaminhamento
        </Button>
        <SaveStatus estado={estado} />
      </div>
      {mensagem && <SensitiveNote>{mensagem}</SensitiveNote>}

      {aberto && (
        <form onSubmit={salvarAtendimento} className="card-surface space-y-4 p-5">
          <h3 className="text-base font-semibold">Registrar atendimento</h3>
          <p className="text-sm text-muted-foreground">
            Profissional responsável: {profissional} ({perfilProfissional}). O registro usa o usuário autenticado.
          </p>
          <div>
            <Label className="mb-1.5 block text-sm">Data e hora</Label>
            <Input
              type="datetime-local"
              value={form.dataHora}
              onChange={(e) => setForm({ ...form, dataHora: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Registro do atendimento</Label>
            <Textarea rows={3} required value={form.registro} onChange={(e) => setForm({ ...form, registro: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">Intervenções com o usuário</Label>
              <Textarea rows={3} value={form.intervencaoUsuario} onChange={(e) => setForm({ ...form, intervencaoUsuario: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Intervenções com a família</Label>
              <Textarea rows={3} value={form.intervencaoFamilia} onChange={(e) => setForm({ ...form, intervencaoFamilia: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.sigiloso} onCheckedChange={(c) => setForm({ ...form, sigiloso: !!c })} />
            Marcar conteúdo como sigiloso (restrito à equipe técnica e coordenação)
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={estado === "saving"}>Salvar atendimento</Button>
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
            <SaveStatus estado={estado} />
          </div>
        </form>
      )}

      {novoEnc && (
        <form onSubmit={salvarEncaminhamento} className="card-surface space-y-4 p-5">
          <h3 className="text-base font-semibold">Registrar encaminhamento</h3>
          <p className="text-sm text-muted-foreground">Registrado por {profissional}.</p>
          <div>
            <Label className="mb-1.5 block text-sm">Destino / serviço da rede</Label>
            <Input required value={formEnc.destino} onChange={(e) => setFormEnc({ ...formEnc, destino: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Motivo</Label>
            <Textarea rows={2} value={formEnc.motivo} onChange={(e) => setFormEnc({ ...formEnc, motivo: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={estado === "saving"}>Salvar encaminhamento</Button>
            <Button type="button" variant="ghost" onClick={() => setNovoEnc(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="space-y-4 border-l-2 border-border pl-5">
        {linha.map((r) =>
          r.tipo === "atendimento" ? (
            <AtendimentoCard key={r.item.id} a={r.item} podeVerSigiloso={perm.verSaude} />
          ) : (
            <EncaminhamentoCard key={r.item.id} e={r.item} />
          ),
        )}
        {linha.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum registro na linha do tempo deste educando.</p>
        )}
      </div>
    </div>
  );
}

function AtendimentoCard({ a, podeVerSigiloso }: { a: Atendimento; podeVerSigiloso: boolean }) {
  const oculto = a.sigiloso && !podeVerSigiloso;
  return (
    <article className="card-surface relative p-4">
      <span className="absolute -left-[27px] top-6 size-3 rounded-full bg-primary" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary">Atendimento</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" /> {formatarDataHora(a.dataHora)}
        </span>
      </div>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
        <UserRound className="size-4 text-primary" /> {a.profissional}
        <span className="text-xs font-normal text-muted-foreground">({a.perfilProfissional})</span>
      </p>
      {oculto ? (
        <div className="mt-3">
          <SensitiveNote>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" /> Conteúdo sigiloso — restrito à equipe técnica e à coordenação.
            </span>
          </SensitiveNote>
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          <p>{a.registro}</p>
          <p><strong className="text-muted-foreground">Com o usuário:</strong> {a.intervencaoUsuario || "—"}</p>
          <p><strong className="text-muted-foreground">Com a família:</strong> {a.intervencaoFamilia || "—"}</p>
          {a.sigiloso && (
            <Badge variant="outline" className="mt-1">
              <Lock className="size-3" /> Sigiloso
            </Badge>
          )}
        </div>
      )}
    </article>
  );
}

function EncaminhamentoCard({ e }: { e: Encaminhamento }) {
  const { registrarAcompanhamento } = useStore();
  const { estado, salvar, mensagem } = useSalvar();
  const [formAberto, setFormAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const situacao = situacaoAtualEncaminhamento(e);
  const historico = [...e.acompanhamentos].sort((a, b) => a.data.localeCompare(b.data));
  const [acomp, setAcomp, limpar] = useRascunho(`rascunho:efetivacao:${e.id}`, {
    data: new Date().toISOString().slice(0, 10),
    observacoes: "",
    status: situacao,
  });

  const gravar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const ok = await salvar(() =>
      registrarAcompanhamento(e.id, {
        id: novoId("acp"),
        data: acomp.data,
        situacao: acomp.status,
        observacao: acomp.observacoes,
      }),
    );
    if (ok) {
      limpar();
      setAcomp({ data: new Date().toISOString().slice(0, 10), observacoes: "", status: acomp.status });
      setFormAberto(false);
      setHistoricoAberto(true);
    }
  };

  return (
    <article className="card-surface relative p-4">
      <span className="absolute -left-[27px] top-6 size-3 rounded-full bg-info" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Encaminhamento</Badge>
          <Badge variant={badgeStatus(situacao)}>{situacao}</Badge>
          {historico.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-expanded={historicoAberto}
              aria-label={historicoAberto ? "Ocultar histórico de acompanhamentos" : "Ver histórico de acompanhamentos"}
              onClick={() => setHistoricoAberto((v) => !v)}
            >
              <ChevronDown className={`size-4 transition-transform ${historicoAberto ? "rotate-180" : ""}`} />
            </Button>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" /> {formatarDataHora(e.dataHora)}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium">{e.destino}</p>
      <p className="text-sm text-muted-foreground">{e.motivo}</p>
      <p className="mt-1 text-xs text-muted-foreground">Registrado por {e.profissional}</p>
      {historicoAberto && (
        <ul className="mt-3 space-y-2 border-l border-dashed border-border pl-4">
          {historico.map((item) => (
            <li key={item.id} className="text-sm">
              <span className="text-xs text-muted-foreground">
                {item.data.split("-").reverse().join("/")} · {item.situacao}
              </span>
              <p>{item.observacao}</p>
            </li>
          ))}
        </ul>
      )}
      {formAberto ? (
        <form onSubmit={gravar} className="mt-3 space-y-3 rounded-lg bg-muted p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">Data do acompanhamento</Label>
              <Input type="date" value={acomp.data} onChange={(ev) => setAcomp({ ...acomp, data: ev.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Situação</Label>
              <Select value={acomp.status} onValueChange={(v) => setAcomp({ ...acomp, status: v as StatusEncaminhamento })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Observações</Label>
            <Textarea rows={2} required value={acomp.observacoes} onChange={(ev) => setAcomp({ ...acomp, observacoes: ev.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">
            O destino e o motivo originais permanecem. Este registro é acrescentado ao histórico.
          </p>
          {mensagem && <p className="text-sm text-destructive">{mensagem}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={estado === "saving"}>Registrar acompanhamento</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setFormAberto(false)}>Cancelar</Button>
            <SaveStatus estado={estado} />
          </div>
        </form>
      ) : (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setFormAberto(true)}>
          Registrar acompanhamento
        </Button>
      )}
    </article>
  );
}
