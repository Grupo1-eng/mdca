import React, { useState } from "react";
import { type LogEntry } from './NavBar';
import { LoadingState, ErrorState } from './StatusMessage';
import { ModalShell, FieldMd, inputMdCls, selectCls, chevronBg } from './ModalShell';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useAuth } from '@/context/AuthContext';
import { inativarUsuario } from '@/api/usuarios';
import { PERFIS, rotuloPerfil } from '@/lib/rotulos';
import { formatDate } from '@/lib/format';
import type { EdicaoUsuario, NovoUsuario, Perfil, Usuario } from '@/types/financeiro';

const SENHA_MINIMA = 8;

// ── Modal criar/editar ──────────────────────────────────────────────────────
function ModalUsuario({ initial, proprio, onClose, onSave }: {
  initial: Usuario | null;
  // Editando a própria conta: o backend não deixa mudar o próprio perfil.
  proprio: boolean;
  onClose: () => void;
  onSave: (dados: NovoUsuario | EdicaoUsuario) => Promise<void>;
}) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    email: initial?.email ?? "",
    perfil: (initial?.perfil ?? "administrativo") as Perfil,
    senha: "",
    confirmarSenha: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.senha !== form.confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (initial) {
        const dados: EdicaoUsuario = { nome: form.nome.trim(), email: form.email.trim() };
        if (!proprio) dados.perfil = form.perfil;
        if (form.senha) dados.senha = form.senha;
        await onSave(dados);
      } else {
        await onSave({ nome: form.nome.trim(), email: form.email.trim(), perfil: form.perfil, senha: form.senha });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  const senhaObrigatoria = !initial;

  return (
    <ModalShell
      title={initial ? "Editar usuário" : "Novo usuário"}
      subtitle={initial ? "Atualize os dados de acesso" : "A pessoa entra com este e-mail e a senha inicial definida aqui"}
      onClose={onClose} onSubmit={handleSubmit}
      submitLabel={initial ? "Salvar alterações" : "Criar usuário"}
      submitting={submitting} error={error}
    >
      <FieldMd label="Nome completo" required>
        <input type="text" required value={form.nome} onChange={set("nome")} placeholder="Maria Oliveira" className={inputMdCls} />
      </FieldMd>
      <FieldMd label="E-mail" required>
        <input type="email" required value={form.email} onChange={set("email")} placeholder="maria@organizacao.org.br" className={inputMdCls} />
      </FieldMd>
      <FieldMd label="Perfil" required>
        <select required value={form.perfil} onChange={set("perfil")} disabled={proprio} className={selectCls + " disabled:bg-[var(--muted)] disabled:cursor-not-allowed"} style={chevronBg}>
          {PERFIS.map(p => <option key={p} value={p}>{rotuloPerfil[p]}</option>)}
        </select>
        {proprio && <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Você não pode alterar o próprio perfil.</p>}
      </FieldMd>
      <div className="grid grid-cols-2 gap-3">
        <FieldMd label={initial ? "Nova senha" : "Senha inicial"} required={senhaObrigatoria}>
          <input type="password" required={senhaObrigatoria} minLength={SENHA_MINIMA} value={form.senha} onChange={set("senha")}
            placeholder={`Mín. ${SENHA_MINIMA} caracteres`} autoComplete="new-password" className={inputMdCls} />
        </FieldMd>
        <FieldMd label="Confirmar senha" required={senhaObrigatoria || form.senha !== ""}>
          <input type="password" required={senhaObrigatoria || form.senha !== ""} value={form.confirmarSenha} onChange={set("confirmarSenha")}
            placeholder="Repetir" autoComplete="new-password" className={inputMdCls} />
        </FieldMd>
      </div>
      {initial && <p className="text-[10px] text-[var(--muted-foreground)] -mt-2">Deixe a senha em branco para manter a atual.</p>}
    </ModalShell>
  );
}

// ── Confirmação de inativação ───────────────────────────────────────────────
function ModalInativar({ usuario, onClose, onConfirm }: {
  usuario: Usuario;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível inativar o usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Inativar usuário" subtitle={usuario.nome} onClose={onClose} onSubmit={handleSubmit}
      submitLabel="Inativar" submitting={submitting} error={error}>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        {usuario.nome} perde o acesso ao sistema imediatamente. Os registros feitos por essa pessoa são mantidos,
        e a conta pode ser reativada depois.
      </p>
    </ModalShell>
  );
}

// ── Tela ─────────────────────────────────────────────────────────────────────
export default function Usuarios({ addLog }: { addLog: (e: Omit<LogEntry, "id" | "timestamp">) => void }) {
  const { user } = useAuth();
  const { data: usuarios, loading, error, create, update, refetch } = useUsuarios();
  const [modal, setModal] = useState<{ usuario: Usuario | null } | null>(null);
  const [inativando, setInativando] = useState<Usuario | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const termo = busca.toLowerCase();
  const filtrados = usuarios.filter(u => termo === "" || u.nome.toLowerCase().includes(termo) || u.email.includes(termo));
  const ativos = usuarios.filter(u => u.ativo).length;

  const handleSave = async (dados: NovoUsuario | EdicaoUsuario) => {
    const editando = modal?.usuario;
    if (editando) {
      const atualizado = await update(editando.id, dados as EdicaoUsuario);
      addLog({ modulo: "Usuários", acao: "edição", descricao: `Usuário atualizado: ${atualizado.nome}`, detalhe: rotuloPerfil[atualizado.perfil] });
    } else {
      const criado = await create(dados as NovoUsuario);
      addLog({ modulo: "Usuários", acao: "adição", descricao: `Novo usuário: ${criado.nome}`, detalhe: `${criado.email} · ${rotuloPerfil[criado.perfil]}` });
    }
  };

  const handleInativar = async () => {
    if (!inativando) return;
    await inativarUsuario(inativando.id);
    await refetch();
    addLog({ modulo: "Usuários", acao: "remoção", descricao: `Usuário inativado: ${inativando.nome}`, detalhe: inativando.email });
  };

  const reativar = async (u: Usuario) => {
    setErroAcao(null);
    try {
      await update(u.id, { ativo: true });
      addLog({ modulo: "Usuários", acao: "edição", descricao: `Usuário reativado: ${u.nome}`, detalhe: u.email });
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : "Não foi possível reativar o usuário.");
    }
  };

  return (
    <>
      {modal && (
        <ModalUsuario
          initial={modal.usuario}
          proprio={modal.usuario?.id === user?.id}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {inativando && <ModalInativar usuario={inativando} onClose={() => setInativando(null)} onConfirm={handleInativar} />}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[var(--foreground)]">Usuários</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {usuarios.length} usuário{usuarios.length === 1 ? "" : "s"} · {ativos} ativo{ativos === 1 ? "" : "s"}
            </p>
          </div>
          <button onClick={() => setModal({ usuario: null })} className="text-xs bg-[#1a3a6b] text-white rounded px-3 py-1.5 hover:bg-[#142e57] transition-colors cursor-pointer">
            + Novo usuário
          </button>
        </div>

        {error && <ErrorState message={error} />}
        {erroAcao && <ErrorState message={erroAcao} />}

        {loading ? <LoadingState /> : (
          <div className="bg-white rounded-lg border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="relative max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input type="text" placeholder="Buscar por nome ou e-mail…" value={busca} onChange={e => setBusca(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs border border-[var(--border)] rounded-md bg-white focus:outline-none focus:border-[#1a3a6b] transition-colors" />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-[var(--border)]">
                  {["Nome", "E-mail", "Perfil", "Criado em", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-mono uppercase tracking-wide text-[var(--muted-foreground)] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(u => {
                  const proprio = u.id === user?.id;
                  return (
                    <tr key={u.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors group">
                      <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                        {u.nome}
                        {proprio && <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a3a6b]/10 text-[#1a3a6b] uppercase">você</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--muted-foreground)]">{u.email}</td>
                      <td className="px-5 py-3 text-xs">{rotuloPerfil[u.perfil] ?? u.perfil}</td>
                      <td className="px-5 py-3 text-xs font-mono text-[var(--muted-foreground)]">{formatDate(u.criadoEm)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${u.ativo ? "bg-[#0e7e6e]/10 text-[#0e7e6e]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ usuario: u })} className="text-xs text-[#1a3a6b] hover:underline cursor-pointer">Editar</button>
                        {!proprio && (u.ativo ? (
                          <button onClick={() => setInativando(u)} className="text-xs text-red-600 hover:underline cursor-pointer ml-3">Inativar</button>
                        ) : (
                          <button onClick={() => reativar(u)} className="text-xs text-[#0e7e6e] hover:underline cursor-pointer ml-3">Reativar</button>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
