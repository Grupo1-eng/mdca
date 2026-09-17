import React, { useState } from "react";
import { fmt } from '@/lib/format';
import { type LogEntry } from './NavBar';

type CadastroKey = "contatos" | "contas" | "fontes" | "categorias";

const cadastrosMeta: { key: CadastroKey; label: string; sublabel: string }[] = [
  { key: "contatos", label: "Contatos", sublabel: "Parceiros e financiadores" },
  { key: "contas", label: "Contas Financeiras", sublabel: "Bancos e caixas" },
  { key: "fontes", label: "Fontes de Recursos", sublabel: "Origens dos recursos" },
  { key: "categorias", label: "Categorias", sublabel: "Plano de contas" },
];

const contatosData = [
  { nome: "Instituto Cidadania", tipo: "Financiador", cnpj: "12.345.678/0001-90", email: "contato@institutocidadania.org.br", telefone: "(61) 3333-1234", status: "Ativo" },
  { nome: "Secretaria de Educação — DF", tipo: "Gov. Distrital", cnpj: "00.394.502/0001-44", email: "convenios@se.df.gov.br", telefone: "(61) 3901-5555", status: "Ativo" },
  { nome: "Fundação Banco do Brasil", tipo: "Financiador", cnpj: "28.541.667/0001-53", email: "projetos@fbb.org.br", telefone: "(61) 3108-2100", status: "Ativo" },
  { nome: "Gráfica Novo Horizonte", tipo: "Fornecedor", cnpj: "45.678.912/0001-23", email: "comercial@graficanovohorizonte.com.br", telefone: "(61) 3222-8899", status: "Ativo" },
  { nome: "Maria José Santos", tipo: "Beneficiária", cnpj: "—", email: "mariajose@gmail.com", telefone: "(61) 98765-4321", status: "Ativo" },
  { nome: "Consultoria AdmONG", tipo: "Fornecedor", cnpj: "67.890.123/0001-45", email: "financeiro@admong.com.br", telefone: "(61) 3111-2233", status: "Inativo" },
];

const contasData = [
  { nome: "C/C Bradesco", banco: "Bradesco", agencia: "1234-5", conta: "12345-6", tipo: "Conta Corrente", saldo: 121440, status: "Ativa" },
  { nome: "C/C Itaú", banco: "Itaú", agencia: "0567-8", conta: "98765-4", tipo: "Conta Corrente", saldo: 62880, status: "Ativa" },
  { nome: "Caixa Pequenas Despesas", banco: "—", agencia: "—", conta: "—", tipo: "Caixa Interno", saldo: 1200, status: "Ativa" },
];

const fontesData = [
  { nome: "Convênio SEDES", origem: "Gov. Estadual", tipo: "Convênio", vigencia: "Mar 2026 – Fev 2027", valor: 148000, status: "Vigente" },
  { nome: "Instituto Cidadania", origem: "Privado", tipo: "Doação", vigencia: "Jun 2026 – Mai 2027", valor: 92000, status: "Vigente" },
  { nome: "Edital Cultura Viva", origem: "Gov. Federal", tipo: "Edital", vigencia: "Out 2026 – Set 2027", valor: 76000, status: "Aguardando" },
  { nome: "Recursos Próprios", origem: "Interno", tipo: "Recurso Próprio", vigencia: "Contínuo", valor: 0, status: "Vigente" },
];

const categoriasData = [
  { codigo: "1.0", nome: "Receitas", tipo: "Receita", subcategorias: ["1.1 Convênios e contratos", "1.2 Doações institucionais", "1.3 Doações pessoas físicas", "1.4 Rendimentos financeiros"] },
  { codigo: "2.0", nome: "Pessoal e Encargos", tipo: "Despesa", subcategorias: ["2.1 Salários", "2.2 Encargos sociais", "2.3 Bolsas educacionais"] },
  { codigo: "3.0", nome: "Custeio Operacional", tipo: "Despesa", subcategorias: ["3.1 Aluguel", "3.2 Energia e água", "3.3 Internet e telefonia", "3.4 Material de escritório"] },
  { codigo: "4.0", nome: "Projetos e Programas", tipo: "Despesa", subcategorias: ["4.1 Material didático", "4.2 Transporte", "4.3 Produção de eventos", "4.4 Contratação de serviços"] },
];

// ── shared modal shell ────────────────────────────────────────────────────────
const selectCls = "w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all appearance-none";
const inputMdCls = "w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all";
const chevronBg = { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat" as const, backgroundPosition: "right 12px center" };

function FieldMd({ label, required: req, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, onSubmit, submitLabel, children }: {
  title: string; subtitle: string; onClose: () => void;
  onSubmit: (e: React.FormEvent) => void; submitLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0f1e3d]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {children}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="flex-1 h-10 rounded-md bg-[#0f1e3d] text-white text-sm font-semibold hover:bg-[#1a3060] transition-colors cursor-pointer">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Novo Contato ────────────────────────────────────────────────────────
const tiposContato = ["Financiador", "Gov. Federal", "Gov. Estadual", "Gov. Distrital", "Gov. Municipal", "Fornecedor", "Parceiro", "Beneficiário", "Outro"];
const ufsLista = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

function ModalNovoContato({ onClose, onSave }: { onClose: () => void; onSave: (c: typeof contatosData[0]) => void }) {
  const [form, setForm] = useState({ nome: "", tipo: "", cnpj: "", email: "", telefone: "", endereco: "", municipio: "", uf: "", cep: "", responsavel: "", status: "Ativo" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nome: form.nome, tipo: form.tipo, cnpj: form.cnpj || "—", email: form.email, telefone: form.telefone, status: form.status });
    onClose();
  };

  return (
    <ModalShell title="Novo contato" subtitle="Parceiro, financiador, fornecedor ou beneficiário" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar contato">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldMd label="Nome / razão social" required>
            <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Instituto Esperança" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Tipo de contato" required>
          <select required value={form.tipo} onChange={set("tipo")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {tiposContato.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Status">
          <select value={form.status} onChange={set("status")} className={selectCls} style={chevronBg}>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </FieldMd>
        <FieldMd label="CNPJ">
          <input type="text" value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <FieldMd label="Telefone">
          <input type="text" value={form.telefone} onChange={set("telefone")} placeholder="(00) 00000-0000" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="E-mail" required>
            <input type="email" required value={form.email} onChange={set("email")} placeholder="contato@organizacao.org.br" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Responsável / pessoa de contato">
          <input type="text" value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do responsável" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="CEP">
          <input type="text" value={form.cep} onChange={set("cep")} placeholder="00000-000" className={inputMdCls + " font-mono"} />
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Endereço">
            <input type="text" value={form.endereco} onChange={set("endereco")} placeholder="Rua, número, complemento" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Município">
          <input type="text" value={form.municipio} onChange={set("municipio")} placeholder="Brasília" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="UF">
          <select value={form.uf} onChange={set("uf")} className={selectCls} style={chevronBg}>
            <option value="">—</option>
            {ufsLista.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </FieldMd>
      </div>
    </ModalShell>
  );
}

function CadContatos({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const [lista, setLista] = useState(contatosData);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = lista.filter(c => search === "" || c.nome.toLowerCase().includes(search.toLowerCase()) || c.tipo.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {modal && <ModalNovoContato onClose={() => setModal(false)} onSave={c => {
        setLista(prev => [...prev, c]);
        addLog({ modulo: "Cadastros", acao: "adição", descricao: `Novo contato cadastrado: ${c.nome}`, detalhe: `Tipo: ${c.tipo} · ${c.email}` });
      }} />}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Contatos</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{lista.length} registros cadastrados</p>
          </div>
          <button onClick={() => setModal(true)} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo contato
          </button>
        </div>
        <div className="relative mb-4 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Buscar contato…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors" />
        </div>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                {["Nome","Tipo","CNPJ / CPF","E-mail","Telefone","Status",""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors group">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{c.nome}</td>
                  <td className="px-4 py-3"><span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{c.tipo}</span></td>
                  <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{c.cnpj}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{c.email}</td>
                  <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{c.telefone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.status==="Ativo"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs text-[#1a3a6b] hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const bancosList = [
  "Banco do Brasil", "Bradesco", "Caixa Econômica Federal", "Itaú", "Santander",
  "Sicredi", "Sicoob", "Nubank", "Inter", "BTG Pactual", "Safra", "BRB", "Outro",
];

const tipoContaList = [
  "Conta Corrente", "Conta Poupança", "Conta de Investimento", "Caixa Interno", "Fundo de Aplicação",
];

function ModalNovaConta({ onClose, onSave }: { onClose: () => void; onSave: (c: typeof contasData[0]) => void }) {
  const [form, setForm] = useState({ nome: "", tipo: "", banco: "", agencia: "", conta: "", saldo: "" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const isCaixa = form.tipo === "Caixa Interno";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome: form.nome || (isCaixa ? "Caixa Interno" : `${form.tipo} ${form.banco}`),
      banco: isCaixa ? "—" : form.banco,
      agencia: isCaixa ? "—" : form.agencia,
      conta: isCaixa ? "—" : form.conta,
      tipo: form.tipo,
      saldo: parseFloat(form.saldo.replace(",", ".")) || 0,
      status: "Ativa",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0f1e3d]/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Nova conta financeira</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Preencha os dados da conta para cadastrá-la</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Tipo de conta */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
              Tipo de conta <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={form.tipo}
              onChange={set("tipo")}
              className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="">Selecionar…</option>
              {tipoContaList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Banco — oculto para Caixa Interno */}
          {!isCaixa && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                Banco relacionado <span className="text-red-400">*</span>
              </label>
              <select
                required={!isCaixa}
                value={form.banco}
                onChange={set("banco")}
                className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
              >
                <option value="">Selecionar…</option>
                {bancosList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {/* Agência e Conta — lado a lado, ocultos para Caixa Interno */}
          {!isCaixa && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                  Agência <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required={!isCaixa}
                  value={form.agencia}
                  onChange={set("agencia")}
                  placeholder="0001-2"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                  Número da conta <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required={!isCaixa}
                  value={form.conta}
                  onChange={set("conta")}
                  placeholder="12345-6"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* Nome de identificação */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
              Nome de identificação
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={set("nome")}
              placeholder={isCaixa ? "Ex: Caixa da sede" : "Ex: C/C Bradesco principal"}
              className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all"
            />
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Deixe em branco para usar o nome automático.</p>
          </div>

          {/* Saldo inicial */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
              Saldo inicial (R$) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] font-mono select-none">R$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.saldo}
                onChange={set("saldo")}
                placeholder="0,00"
                className="w-full h-10 pl-10 pr-3 rounded-md border border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-md bg-[#0f1e3d] text-white text-sm font-semibold hover:bg-[#1a3060] transition-colors cursor-pointer"
            >
              Salvar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CadContas({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const [lista, setLista] = useState(contasData);
  const [modalAberto, setModalAberto] = useState(false);

  const handleSave = (nova: typeof contasData[0]) => {
    setLista((prev) => [...prev, nova]);
    addLog({ modulo: "Cadastros", acao: "adição", descricao: `Nova conta financeira cadastrada: ${nova.nome}`, detalhe: `${nova.tipo} · Saldo inicial: ${fmt(nova.saldo)}` });
  };

  return (
    <>
      {modalAberto && (
        <ModalNovaConta onClose={() => setModalAberto(false)} onSave={handleSave} />
      )}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Contas Financeiras</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Saldo consolidado: {fmt(lista.reduce((a,b)=>a+b.saldo,0))}</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova conta
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {lista.map((c, i) => (
            <div key={i} className="border border-[var(--border)] rounded-lg bg-white p-5 flex items-center justify-between group hover:border-[#1a3a6b]/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0f1e3d]/5 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f1e3d" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{c.nome}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{c.banco !== "—" ? `${c.banco} · Ag. ${c.agencia} · C/C ${c.conta}` : c.tipo}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)]">Saldo atual</p>
                  <p className="text-lg font-semibold text-[#0e7e6e] font-mono">{fmt(c.saldo)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.status==="Ativa"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{c.status}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-[var(--border)] rounded px-2.5 py-1 hover:bg-[var(--muted)]">Editar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Modal Nova Fonte de Recursos ──────────────────────────────────────────────
const tiposFonte = ["Convênio", "Contrato", "Edital", "Doação", "Recurso Próprio", "Subvenção", "Patrocínio", "Outro"];
const origensLista = ["Gov. Federal", "Gov. Estadual", "Gov. Distrital", "Gov. Municipal", "Privado", "Internacional", "Pessoa Física", "Interno"];

function ModalNovaFonte({ onClose, onSave }: { onClose: () => void; onSave: (f: typeof fontesData[0]) => void }) {
  const [form, setForm] = useState({ nome: "", tipo: "", origem: "", numero: "", objeto: "", vigIni: "", vigFim: "", valor: "", status: "Vigente" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vigencia = form.vigIni && form.vigFim ? `${form.vigIni} – ${form.vigFim}` : form.vigIni || "Contínuo";
    onSave({ nome: form.nome, tipo: form.tipo, origem: form.origem, vigencia, valor: parseFloat(form.valor.replace(",",".")) || 0, status: form.status });
    onClose();
  };

  return (
    <ModalShell title="Nova fonte de recursos" subtitle="Registre a origem e condições do recurso" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar fonte">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldMd label="Nome da fonte / programa" required>
            <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Convênio SEDES — Educação Rural" className={inputMdCls} />
          </FieldMd>
        </div>
        <FieldMd label="Tipo de fonte" required>
          <select required value={form.tipo} onChange={set("tipo")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {tiposFonte.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldMd>
        <FieldMd label="Origem dos recursos" required>
          <select required value={form.origem} onChange={set("origem")} className={selectCls} style={chevronBg}>
            <option value="">Selecionar…</option>
            {origensLista.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Número do instrumento (convênio, contrato, edital…)">
            <input type="text" value={form.numero} onChange={set("numero")} placeholder="Ex: 001/2026 — SEDES/DF" className={inputMdCls + " font-mono"} />
          </FieldMd>
        </div>
        <FieldMd label="Início da vigência">
          <input type="text" value={form.vigIni} onChange={set("vigIni")} placeholder="Mar 2026" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="Fim da vigência">
          <input type="text" value={form.vigFim} onChange={set("vigFim")} placeholder="Fev 2027" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="Valor total (R$)" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] font-mono select-none">R$</span>
            <input type="number" required min="0" step="0.01" value={form.valor} onChange={set("valor")} placeholder="0,00" className={inputMdCls + " pl-10 font-mono"} />
          </div>
        </FieldMd>
        <FieldMd label="Status">
          <select value={form.status} onChange={set("status")} className={selectCls} style={chevronBg}>
            <option value="Vigente">Vigente</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Encerrado">Encerrado</option>
          </select>
        </FieldMd>
        <div className="col-span-2">
          <FieldMd label="Objeto / descrição resumida">
            <textarea value={form.objeto} onChange={set("objeto")} rows={2} placeholder="Descreva brevemente o objeto do convênio ou programa…"
              className={inputMdCls + " h-auto py-2 resize-none"} />
          </FieldMd>
        </div>
      </div>
    </ModalShell>
  );
}

function CadFontes({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const [lista, setLista] = useState(fontesData);
  const [modal, setModal] = useState(false);

  return (
    <>
      {modal && <ModalNovaFonte onClose={() => setModal(false)} onSave={f => {
        setLista(prev => [...prev, f]);
        addLog({ modulo: "Cadastros", acao: "adição", descricao: `Nova fonte de recursos cadastrada: ${f.nome}`, detalhe: `${f.tipo} · ${f.origem} · ${f.valor > 0 ? fmt(f.valor) : "Sem valor definido"}` });
      }} />}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Fontes de Recursos</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{lista.length} fontes registradas</p>
          </div>
          <button onClick={() => setModal(true)} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova fonte
          </button>
        </div>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                {["Fonte","Origem","Tipo","Vigência","Valor total","Status",""].map(h => (
                  <th key={h} className="py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium text-left px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((f, i) => (
                <tr key={i} className="border-t border-[var(--border)] bg-white hover:bg-[var(--muted)] transition-colors group">
                  <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{f.nome}</td>
                  <td className="px-4 py-3.5 text-xs text-[var(--muted-foreground)]">{f.origem}</td>
                  <td className="px-4 py-3.5"><span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{f.tipo}</span></td>
                  <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted-foreground)]">{f.vigencia}</td>
                  <td className="px-4 py-3.5 text-xs font-mono font-medium">{f.valor > 0 ? fmt(f.valor) : "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      f.status==="Vigente"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":
                      f.status==="Aguardando"?"bg-amber-100 text-amber-700":"bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs text-[#1a3a6b] hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Modal Nova Categoria ──────────────────────────────────────────────────────
function ModalNovaCategoria({ onClose, onSave, categoriasPai }: {
  onClose: () => void;
  onSave: (cat: { codigo: string; nome: string; tipo: string; subcategorias: string[] }) => void;
  categoriasPai: { codigo: string; nome: string }[];
}) {
  const [form, setForm] = useState({ nome: "", tipo: "Despesa", codigo: "", descricao: "", pai: "" });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));
  const isSub = form.pai !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSub) {
      onSave({ codigo: form.pai, nome: "", tipo: "", subcategorias: [form.nome] });
    } else {
      onSave({ codigo: form.codigo || `${categoriasPai.length + 1}.0`, nome: form.nome, tipo: form.tipo, subcategorias: [] });
    }
    onClose();
  };

  return (
    <ModalShell title="Nova categoria" subtitle="Categoria principal ou subcategoria do plano de contas" onClose={onClose} onSubmit={handleSubmit} submitLabel="Salvar categoria">
      <div className="space-y-4">
        {/* Tipo de entrada: principal ou subcategoria */}
        <div className="grid grid-cols-2 gap-2">
          {(["principal", "subcategoria"] as const).map(opt => {
            const ativo = isSub ? opt === "subcategoria" : opt === "principal";
            return (
              <button key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, pai: opt === "subcategoria" ? (categoriasPai[0]?.codigo ?? "") : "" }))}
                className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${ativo ? "border-[#0f1e3d] bg-[#0f1e3d]/5" : "border-[var(--border)] hover:bg-[var(--muted)]"}`}
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
                {categoriasPai.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
              </select>
            </FieldMd>
            <FieldMd label="Nome da subcategoria" required>
              <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Salários, Bolsas educacionais…" className={inputMdCls} />
            </FieldMd>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <FieldMd label="Código">
                <input type="text" value={form.codigo} onChange={set("codigo")} placeholder={`${categoriasPai.length + 1}.0`} className={inputMdCls + " font-mono"} />
              </FieldMd>
              <div className="col-span-2">
                <FieldMd label="Nome da categoria" required>
                  <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Ex: Custeio Operacional" className={inputMdCls} />
                </FieldMd>
              </div>
            </div>
            <FieldMd label="Tipo" required>
              <div className="grid grid-cols-2 gap-2">
                {(["Receita", "Despesa"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: t }))}
                    className={`h-10 rounded-md border text-sm font-medium transition-all cursor-pointer ${form.tipo === t
                      ? t === "Receita" ? "border-[#0e7e6e] bg-[#0e7e6e]/10 text-[#0e7e6e]" : "border-[#0f1e3d] bg-[#0f1e3d]/10 text-[#0f1e3d]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FieldMd>
            <FieldMd label="Descrição / observação">
              <textarea value={form.descricao} onChange={set("descricao")} rows={2} placeholder="Descreva brevemente o escopo desta categoria…"
                className={inputMdCls + " h-auto py-2 resize-none"} />
            </FieldMd>
          </>
        )}
      </div>
    </ModalShell>
  );
}

function CadCategorias({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const [lista, setLista] = useState(categoriasData);
  const [expanded, setExpanded] = useState<string | null>("1.0");
  const [modal, setModal] = useState(false);

  const handleSave = (input: { codigo: string; nome: string; tipo: string; subcategorias: string[] }) => {
    if (input.nome === "" && input.subcategorias.length > 0) {
      const sub = input.subcategorias[0];
      const pai = lista.find(c => c.codigo === input.codigo);
      setLista(prev => prev.map(c => c.codigo === input.codigo ? { ...c, subcategorias: [...c.subcategorias, sub] } : c));
      setExpanded(input.codigo);
      addLog({ modulo: "Cadastros", acao: "adição", descricao: `Subcategoria adicionada: ${sub}`, detalhe: `Dentro de ${pai?.nome ?? input.codigo}` });
    } else {
      setLista(prev => [...prev, input]);
      addLog({ modulo: "Cadastros", acao: "adição", descricao: `Nova categoria criada: ${input.nome}`, detalhe: `Código ${input.codigo} · ${input.tipo}` });
    }
  };

  return (
    <>
      {modal && (
        <ModalNovaCategoria
          onClose={() => setModal(false)}
          onSave={handleSave}
          categoriasPai={lista.map(c => ({ codigo: c.codigo, nome: c.nome }))}
        />
      )}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">Categorias Financeiras</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Plano de contas da organização</p>
          </div>
          <button onClick={() => setModal(true)} className="text-xs bg-[#0f1e3d] text-white rounded px-3 py-1.5 hover:bg-[#1a3060] transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova categoria
          </button>
        </div>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          {lista.map((cat, i) => {
            const isOpen = expanded === cat.codigo;
            return (
              <div key={cat.codigo} className={i > 0 ? "border-t border-[var(--border)]" : ""}>
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.codigo)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[var(--muted)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-[var(--muted-foreground)] w-8">{cat.codigo}</span>
                    <span className="font-semibold text-[var(--foreground)] text-sm">{cat.nome}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wide ${cat.tipo==="Receita"?"bg-[#0e7e6e]/10 text-[#0e7e6e]":"bg-[#0f1e3d]/10 text-[#0f1e3d]"}`}>{cat.tipo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted-foreground)]">{cat.subcategorias.length} subcategorias</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border)] bg-[#f8f9fc]">
                    {cat.subcategorias.map((sub) => (
                      <div key={sub} className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] last:border-0 group hover:bg-[var(--muted)] transition-colors">
                        <div className="flex items-center gap-3 pl-8">
                          <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]" />
                          <span className="text-sm text-[var(--muted-foreground)]">{sub}</span>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#1a3a6b] hover:underline">Editar</button>
                      </div>
                    ))}
                    <div className="px-5 py-3 pl-16">
                      <button onClick={() => setModal(true)} className="text-xs text-[#0e7e6e] hover:underline flex items-center gap-1 cursor-pointer">
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

// ─── Logo mark ───────────────────────────────────────────────────────────────
