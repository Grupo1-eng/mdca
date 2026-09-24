import React, { useState } from "react";
import { fmt } from '@/lib/format';
import { arvoreCategorias } from '@/lib/aggregations';
import { type LogEntry } from './NavBar';
import { LoadingState, ErrorState } from './StatusMessage';
import { ModalShell, FieldMd, inputMdCls, selectCls, chevronBg } from './ModalShell';
import { useContatos } from '@/hooks/useContatos';
import { useContas } from '@/hooks/useContas';
import { useFontes } from '@/hooks/useFontes';
import { useCategorias } from '@/hooks/useCategorias';
import type { Categoria, Contato, NovoContato, Conta, NovaConta, Fonte, NovaFonte, TipoCategoria } from '@/types/financeiro';

type CadastroKey = "contatos" | "contas" | "fontes" | "categorias";

const cadastrosMeta: { key: CadastroKey; label: string; sublabel: string }[] = [
  { key: "contatos", label: "Contatos", sublabel: "Parceiros e financiadores" },
  { key: "contas", label: "Contas Financeiras", sublabel: "Bancos e caixas" },
  { key: "fontes", label: "Fontes de Recursos", sublabel: "Origens dos recursos" },
  { key: "categorias", label: "Categorias", sublabel: "Plano de contas" },
];

// Campo opcional vazio vira null, para a edição conseguir apagar o valor salvo.
const textoOuNulo = (v: string) => v.trim() || null;

// ── Modal Contato ─────────────────────────────────────────────────────────────
const papeisContato = ["Financiador", "Gov. Federal", "Gov. Estadual", "Gov. Distrital", "Gov. Municipal", "Fornecedor", "Parceiro", "Beneficiário", "Outro"];
const tiposPessoa = ["Pessoa jurídica", "Pessoa física"];

function ModalContato({ initial, onClose, onSave }: {
  initial?: Contato | null;
  onClose: () => void;
  onSave: (c: NovoContato) => Promise<void>;
}) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? "", papel: initial?.papel ?? "", tipo: initial?.tipo ?? "",
    cpfCnpj: initial?.cpfCnpj ?? "", telefone: initial?.telefone ?? "", observacoes: initial?.observacoes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        nome: form.nome.trim(),
        papel: textoOuNulo(form.papel),
        tipo: textoOuNulo(form.tipo),
        cpfCnpj: textoOuNulo(form.cpfCnpj),
        telefone: textoOuNulo(form.telefone),
        observacoes: textoOuNulo(form.observacoes),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o contato.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={initial ? "Editar contato" : "Novo contato"} subtitle="Parceiro, financiador, fornecedor ou beneficiário"
      onClose={onClose} onSubmit={handleSubmit} submitLabel={initial ? "Salvar alterações" : "Salvar contato"}
      submitting={submitting} error={error}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldMd label="Nome / razão social" required>
            <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Instituto Esperança" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Papel">
          <select value={form.papel} onChange={set("papel")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {papeisContato.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Tipo de pessoa">
          <select value={form.tipo} onChange={set("tipo")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {tiposPessoa.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="CPF / CNPJ">
          <input type="text" value={form.cpfCnpj} onChange={set("cpfCnpj")} placeholder="00.000.000/0001-00" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <FieldMd label="Telefone">
          <input type="text" value={form.telefone} onChange={set("telefone")} placeholder="(00) 00000-0000" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Observações">
            <textarea value={form.observacoes} onChange={set("observacoes")} rows={2} placeholder="E-mail, endereço, pessoa de contato…"
              className={inputMdCls + " h-auto py-2 resize-none"} />
          </FieldMd>
        </div>
      </div>
    </ModalShell>
  );
}

function CadContatos({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const { data: contatos, loading, error, create, update } = useContatos();
  const [editing, setEditing] = useState<Contato | null>(null);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const termo = search.toLowerCase();
  const filtered = contatos.filter(c => termo === "" || c.nome.toLowerCase().includes(termo) || (c.papel ?? "").toLowerCase().includes(termo));

  const abrirNovo = () => { setEditing(null); setModal(true); };
  const abrirEdicao = (c: Contato) => { setEditing(c); setModal(true); };

  const handleSave = async (values: NovoContato) => {
    if (editing) {
      const atualizado = await update(editing.id, values);
      addLog({ modulo: "Cadastros", acao: "edição", descricao: `Contato atualizado: ${atualizado.nome}`, detalhe: atualizado.papel ?? "" });
    } else {
      const criado = await create(values);
      addLog({ modulo: "Cadastros", acao: "adição", descricao: `Novo contato cadastrado: ${criado.nome}`, detalhe: criado.papel ?? "" });
    }
  };

  return (
    <>
      {modal && <ModalContato initial={editing} onClose={() => setModal(false)} onSave={handleSave} />}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Contatos</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{contatos.length} registros cadastrados</p>
          </div>
          <button onClick={abrirNovo} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo contato
          </button>
        </div>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState /> : (
          <>
            <div className="relative mb-4 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Buscar contato…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors" />
            </div>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                    {["Nome","Papel","Tipo","CPF / CNPJ","Telefone",""].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors group">
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{c.nome}</td>
                      <td className="px-4 py-3">{c.papel && <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{c.papel}</span>}</td>
                      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{c.tipo ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{c.cpfCnpj ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{c.telefone ?? "—"}</td>
                      <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => abrirEdicao(c)} className="text-xs text-[#1a3a6b] hover:underline cursor-pointer">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Modal Conta ────────────────────────────────────────────────────────────────
const bancosList = [
  "Banco do Brasil", "Bradesco", "Caixa Econômica Federal", "Itaú", "Santander",
  "Sicredi", "Sicoob", "Nubank", "Inter", "BTG Pactual", "Safra", "BRB", "Outro",
];

const tipoContaList = [
  "Conta Corrente", "Conta Poupança", "Conta de Investimento", "Caixa Interno", "Fundo de Aplicação",
];

function ModalConta({ initial, onClose, onSave }: {
  initial?: Conta | null;
  onClose: () => void;
  onSave: (c: NovaConta) => Promise<void>;
}) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? "", tipo: initial?.tipo ?? "", banco: initial?.banco ?? "",
    agencia: initial?.agencia ?? "", numero: initial?.numero ?? "", saldoInicial: "",
    ativa: initial ? String(initial.ativa) : "true",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const isCaixa = form.tipo === "Caixa Interno";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const dados: NovaConta = {
        nome: form.nome.trim() || (isCaixa ? "Caixa Interno" : `${form.tipo} ${form.banco}`),
        tipo: textoOuNulo(form.tipo),
        banco: isCaixa ? null : textoOuNulo(form.banco),
        agencia: isCaixa ? null : textoOuNulo(form.agencia),
        numero: isCaixa ? null : textoOuNulo(form.numero),
        ativa: form.ativa === "true",
      };
      // O backend ainda não recalcula o saldo atual a partir dos lançamentos:
      // na criação ele começa igual ao inicial.
      if (!initial && form.saldoInicial) {
        dados.saldoInicial = form.saldoInicial;
        dados.saldoAtual = form.saldoInicial;
      }
      await onSave(dados);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a conta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={initial ? "Editar conta financeira" : "Nova conta financeira"}
      subtitle={initial ? "Atualize os dados da conta" : "Preencha os dados da conta para cadastrá-la"}
      onClose={onClose} onSubmit={handleSubmit} submitLabel={initial ? "Salvar alterações" : "Salvar conta"}
      submitting={submitting} error={error}
    >
      <FieldMd label="Tipo de conta" required>
        <select required value={form.tipo} onChange={set("tipo")} className={selectCls} style={chevronBg}>
          <option value="">Selecionar…</option>
          {tipoContaList.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </FieldMd>

      {!isCaixa && (
        <FieldMd label="Banco relacionado" required>
          <select required={!isCaixa} value={form.banco} onChange={set("banco")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {bancosList.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </FieldMd>
      )}

      {!isCaixa && (
        <div className="grid grid-cols-2 gap-3">
          <FieldMd label="Agência" required>
            <input type="text" required={!isCaixa} value={form.agencia} onChange={set("agencia")} placeholder="0001-2" className={inputMdCls + " font-mono"} />
          </FieldMd>
          <FieldMd label="Número da conta" required>
            <input type="text" required={!isCaixa} value={form.numero} onChange={set("numero")} placeholder="12345-6" className={inputMdCls + " font-mono"} />
          </FieldMd>
        </div>
      )}

      <FieldMd label="Nome de identificação">
        <input type="text" value={form.nome} onChange={set("nome")} placeholder={isCaixa ? "Ex: Caixa da sede" : "Ex: C/C Bradesco principal"} className={inputMdCls} />
        <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Deixe em branco para usar o nome automático.</p>
      </FieldMd>

      {initial ? (
        <FieldMd label="Status">
          <select value={form.ativa} onChange={set("ativa")} className={selectCls} style={chevronBg}>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </select>
        </FieldMd>
      ) : (
        <FieldMd label="Saldo inicial (R$)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] font-mono select-none">R$</span>
            <input type="number" step="0.01" value={form.saldoInicial} onChange={set("saldoInicial")} placeholder="0,00" className={inputMdCls + " pl-10 font-mono"} />
          </div>
        </FieldMd>
      )}
    </ModalShell>
  );
}

function CadContas({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const { data: contas, loading, error, create, update } = useContas();
  const [editing, setEditing] = useState<Conta | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const abrirNova = () => { setEditing(null); setModalAberto(true); };
  const abrirEdicao = (c: Conta) => { setEditing(c); setModalAberto(true); };

  const handleSave = async (values: NovaConta) => {
    if (editing) {
      const atualizada = await update(editing.id, values);
      addLog({ modulo: "Cadastros", acao: "edição", descricao: `Conta financeira atualizada: ${atualizada.nome}`, detalhe: `${atualizada.tipo ?? ""} · Saldo: ${fmt(atualizada.saldoAtual)}` });
    } else {
      const nova = await create(values);
      addLog({ modulo: "Cadastros", acao: "adição", descricao: `Nova conta financeira cadastrada: ${nova.nome}`, detalhe: `${nova.tipo ?? ""} · Saldo inicial: ${fmt(nova.saldoInicial)}` });
    }
  };

  return (
    <>
      {modalAberto && <ModalConta initial={editing} onClose={() => setModalAberto(false)} onSave={handleSave} />}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Contas Financeiras</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Saldo consolidado: {fmt(contas.reduce((a,b)=>a+b.saldoAtual,0))}</p>
          </div>
          <button onClick={abrirNova} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova conta
          </button>
        </div>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState /> : (
          <div className="grid grid-cols-1 gap-3">
            {contas.map((c) => (
              <div key={c.id} className="border border-[var(--border)] rounded-lg bg-white p-5 flex items-center justify-between group hover:border-[#1a3a6b]/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0f1e3d]/5 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f1e3d" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{c.nome}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{c.banco ? `${c.banco} · Ag. ${c.agencia ?? "—"} · C/C ${c.numero ?? "—"}` : c.tipo ?? ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)]">Saldo atual</p>
                    <p className="text-lg font-semibold text-[#0e7e6e] font-mono">{fmt(c.saldoAtual)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.ativa?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{c.ativa ? "Ativa" : "Inativa"}</span>
                  <button onClick={() => abrirEdicao(c)} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-[var(--border)] rounded px-2.5 py-1 hover:bg-[var(--muted)] cursor-pointer">Editar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Modal Fonte de Recursos ───────────────────────────────────────────────────
const origensLista = ["Gov. Federal", "Gov. Estadual", "Gov. Distrital", "Gov. Municipal", "Privado", "Internacional", "Pessoa Física", "Interno"];

function ModalFonte({ initial, onClose, onSave }: {
  initial?: Fonte | null;
  onClose: () => void;
  onSave: (f: NovaFonte) => Promise<void>;
}) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? "", origem: initial?.origem ?? "", ativa: initial ? String(initial.ativa) : "true",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave({ nome: form.nome.trim(), origem: textoOuNulo(form.origem), ativa: form.ativa === "true" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a fonte.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={initial ? "Editar fonte de recursos" : "Nova fonte de recursos"} subtitle="Registre a origem do recurso"
      onClose={onClose} onSubmit={handleSubmit} submitLabel={initial ? "Salvar alterações" : "Salvar fonte"}
      submitting={submitting} error={error}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldMd label="Nome da fonte / programa" required>
            <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Convênio SEDES — Educação Rural" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Origem dos recursos">
          <select value={form.origem} onChange={set("origem")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {origensLista.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Status">
          <select value={form.ativa} onChange={set("ativa")} className={selectCls} style={chevronBg}>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </select>
        </FieldMd>
      </div>
    </ModalShell>
  );
}

function CadFontes({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const { data: fontes, loading, error, create, update } = useFontes();
  const [editing, setEditing] = useState<Fonte | null>(null);
  const [modal, setModal] = useState(false);

  const abrirNova = () => { setEditing(null); setModal(true); };
  const abrirEdicao = (f: Fonte) => { setEditing(f); setModal(true); };

  const handleSave = async (values: NovaFonte) => {
    if (editing) {
      const atualizada = await update(editing.id, values);
      addLog({ modulo: "Cadastros", acao: "edição", descricao: `Fonte de recursos atualizada: ${atualizada.nome}`, detalhe: atualizada.origem ?? "" });
    } else {
      const nova = await create(values);
      addLog({ modulo: "Cadastros", acao: "adição", descricao: `Nova fonte de recursos cadastrada: ${nova.nome}`, detalhe: nova.origem ?? "" });
    }
  };

  return (
    <>
      {modal && <ModalFonte initial={editing} onClose={() => setModal(false)} onSave={handleSave} />}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Fontes de Recursos</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{fontes.length} fontes registradas</p>
          </div>
          <button onClick={abrirNova} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova fonte
          </button>
        </div>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState /> : (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                  {["Fonte","Origem","Status",""].map(h => (
                    <th key={h} className="py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium text-left px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fontes.map((f) => (
                  <tr key={f.id} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors group">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{f.nome}</td>
                    <td className="px-4 py-3.5 text-xs text-[var(--muted-foreground)]">{f.origem ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${f.ativa ? "bg-[#0e7e6e]/10 text-[#0e7e6e]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                        {f.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => abrirEdicao(f)} className="text-xs text-[#1a3a6b] hover:underline cursor-pointer">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── Modal Categoria ────────────────────────────────────────────────────────────
const rotuloTipoCategoria: Record<TipoCategoria, string> = { receita: "Receita", despesa: "Despesa" };

interface SalvarCategoriaInput {
  paiId?: number;
  nome: string;
  tipo: TipoCategoria;
}

function ModalNovaCategoria({ onClose, onSave, categoriasPai, paiInicial }: {
  onClose: () => void;
  onSave: (input: SalvarCategoriaInput) => Promise<void>;
  categoriasPai: Categoria[];
  paiInicial?: number;
}) {
  const [form, setForm] = useState({ nome: "", tipo: "despesa" as TipoCategoria, pai: paiInicial ? String(paiInicial) : "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));
  const isSub = form.pai !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave({ paiId: isSub ? Number(form.pai) : undefined, nome: form.nome.trim(), tipo: form.tipo });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a categoria.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Nova categoria" subtitle="Categoria principal ou subcategoria do plano de contas" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar categoria" submitting={submitting} error={error}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["principal", "subcategoria"] as const).map(opt => {
            const ativo = isSub ? opt === "subcategoria" : opt === "principal";
            return (
              <button key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, pai: opt === "subcategoria" ? String(categoriasPai[0]?.id ?? "") : "" }))}
                disabled={opt === "subcategoria" && categoriasPai.length === 0}
                className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${ativo ? "border-[#0f1e3d] bg-[#0f1e3d]/5" : "border-[var(--border)] hover:bg-[var(--muted)]"}`}
              >
                <span className={`text-xs font-semibold ${ativo ? "text-[#0f1e3d]" : "text-[var(--muted-foreground)]"}`}>
                  {opt === "principal" ? "Categoria principal" : "Subcategoria"}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {opt === "principal" ? "Ex: Pessoal e Encargos" : "Ex: Salários, Bolsas…"}
                </span>
              </button>
            );
          })}
        </div>

        {isSub ? (
          <>
            <FieldMd label="Categoria pai" required>
              <select required value={form.pai} onChange={set("pai")} className={selectCls} style={chevronBg}>
                {categoriasPai.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </FieldMd>
            <FieldMd label="Nome da subcategoria" required>
              <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Salários, Bolsas educacionais…" className={inputMdCls} />
            </FieldMd>
          </>
        ) : (
          <>
            <FieldMd label="Nome da categoria" required>
              <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Custeio Operacional" className={inputMdCls} />
            </FieldMd>
            <FieldMd label="Tipo" required>
              <div className="grid grid-cols-2 gap-2">
                {(["receita", "despesa"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: t }))}
                    className={`h-10 rounded-md border text-sm font-medium transition-all cursor-pointer ${form.tipo === t
                      ? t === "receita" ? "border-[#0e7e6e] bg-[#0e7e6e]/10 text-[#0e7e6e]" : "border-[#0f1e3d] bg-[#0f1e3d]/10 text-[#0f1e3d]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
                  >
                    {rotuloTipoCategoria[t]}
                  </button>
                ))}
              </div>
            </FieldMd>
          </>
        )}
      </div>
    </ModalShell>
  );
}

function ModalEditarSubcategoria({ valorInicial, onClose, onSave }: {
  valorInicial: string;
  onClose: () => void;
  onSave: (novoValor: string) => Promise<void>;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave(valor.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a subcategoria.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Editar subcategoria" subtitle="Atualize o nome da subcategoria" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar alterações" submitting={submitting} error={error}>
      <FieldMd label="Nome da subcategoria" required>
        <input type="text" required value={valor} onChange={e => setValor(e.target.value)} className={inputMdCls} />
      </FieldMd>
    </ModalShell>
  );
}

function CadCategorias({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const { data: categorias, loading, error, create, update } = useCategorias();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modal, setModal] = useState<{ paiId?: number } | null>(null);
  const [editandoSub, setEditandoSub] = useState<Categoria | null>(null);
  const arvore = arvoreCategorias(categorias);

  const handleSave = async (input: SalvarCategoriaInput) => {
    if (input.paiId) {
      const pai = categorias.find(c => c.id === input.paiId);
      if (!pai) return;
      // Subcategoria herda o tipo (receita/despesa) da categoria pai.
      await create({ nome: input.nome, tipo: pai.tipo, categoriaPaiId: pai.id });
      setExpanded(pai.id);
      addLog({ modulo: "Cadastros", acao: "adição", descricao: `Subcategoria adicionada: ${input.nome}`, detalhe: `Dentro de ${pai.nome}` });
    } else {
      const criada = await create({ nome: input.nome, tipo: input.tipo });
      addLog({ modulo: "Cadastros", acao: "adição", descricao: `Nova categoria criada: ${criada.nome}`, detalhe: rotuloTipoCategoria[input.tipo] });
    }
  };

  const handleSalvarSubcategoria = async (novoValor: string) => {
    if (!editandoSub) return;
    await update(editandoSub.id, { nome: novoValor });
    addLog({ modulo: "Cadastros", acao: "edição", descricao: "Subcategoria atualizada", detalhe: `${editandoSub.nome} → ${novoValor}` });
  };

  return (
    <>
      {modal && (
        <ModalNovaCategoria
          onClose={() => setModal(null)}
          onSave={handleSave}
          categoriasPai={arvore.map(n => n.categoria)}
          paiInicial={modal.paiId}
        />
      )}
      {editandoSub && (
        <ModalEditarSubcategoria
          valorInicial={editandoSub.nome}
          onClose={() => setEditandoSub(null)}
          onSave={handleSalvarSubcategoria}
        />
      )}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Categorias Financeiras</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Plano de contas da organização</p>
          </div>
          <button onClick={() => setModal({})} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova categoria
          </button>
        </div>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState /> : (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            {arvore.map(({ categoria: cat, subcategorias }, i) => {
              const isOpen = expanded === cat.id;
              const rotulo = rotuloTipoCategoria[cat.tipo as TipoCategoria] ?? cat.tipo;
              return (
                <div key={cat.id} className={i > 0 ? "border-t border-[var(--border)]" : ""}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : cat.id)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[var(--foreground)] text-sm">{cat.nome}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wide ${cat.tipo==="receita"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[#0f1e3d]/10 text-[#0f1e3d]"}`}>{rotulo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--muted-foreground)]">{subcategorias.length} subcategorias</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--border)] bg-[#f8f9fc]">
                      {subcategorias.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] last:border-0 group hover:bg-[var(--muted)] transition-colors">
                          <div className="flex items-center gap-3 pl-8">
                            <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]" />
                            <span className="text-sm text-[var(--muted-foreground)]">{sub.nome}</span>
                          </div>
                          <button onClick={() => setEditandoSub(sub)} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#1a3a6b] hover:underline cursor-pointer">Editar</button>
                        </div>
                      ))}
                      <div className="px-5 py-3 pl-16">
                        <button onClick={() => setModal({ paiId: cat.id })} className="text-xs text-[#0e7e6e] hover:underline flex items-center gap-1 cursor-pointer">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Adicionar subcategoria
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function Cadastros({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const [cad, setCad] = useState<CadastroKey>("contatos");
  return (
    <div className="flex gap-0 min-h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-white rounded-l-lg">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Cadastros</p>
        </div>
        <nav className="py-2">
          {cadastrosMeta.map((c) => (
            <button
              key={c.key}
              onClick={() => setCad(c.key)}
              className={`w-full text-left px-5 py-3 transition-colors cursor-pointer border-l-2 ${
                cad === c.key
                  ? "border-[#0f1e3d] bg-[#0f1e3d]/5"
                  : "border-transparent hover:bg-[var(--muted)]"
              }`}
            >
              <p className={`text-sm font-medium ${cad === c.key ? "text-[#0f1e3d]" : "text-[var(--foreground)]"}`}>{c.label}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{c.sublabel}</p>
            </button>
          ))}
        </nav>
      </aside>
      {/* Content */}
      <div className="flex-1 bg-white rounded-r-lg border border-[var(--border)] border-l-0 p-6 overflow-y-auto">
        {cad === "contatos" && <CadContatos addLog={addLog} />}
        {cad === "contas" && <CadContas addLog={addLog} />}
        {cad === "fontes" && <CadFontes addLog={addLog} />}
        {cad === "categorias" && <CadCategorias addLog={addLog} />}
      </div>
    </div>
  );
}
