import React, { useState } from "react";
import mdcaLogo from '@/imports/coisaaa.png';
import { useAuth } from "@/context/AuthContext";

function BussolaLogo({ size = 28, light = false }: { size?: number; light?: boolean }) {
  return (
    <img
      src={mdcaLogo}
      alt="MDCA"
      width={size}
      height={size}
      className="rounded-full object-contain"
      style={{ background: light ? "rgba(255,255,255,0.15)" : "#fff" }}
    />
  );
}

// ─── Auth screens ─────────────────────────────────────────────────────────────
function AuthBrand() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#0f1e3d] text-white p-12 relative overflow-hidden">
      {/* decorative rings */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-white/5" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/8" />
      <div className="absolute top-1/3 right-0 w-48 h-48 rounded-full border border-[#0e7e6e]/20" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-14">
          <BussolaLogo size={32} light />
          <div>
            <span className="font-serif text-xl leading-none tracking-tight block">Financeiro MDCA</span>
            <span className="text-[10px] text-[#0e7e6e] font-mono uppercase tracking-[0.2em] block mt-0.5">Sistema</span>
          </div>
        </div>

        <h2 className="font-serif text-4xl leading-[1.15] mb-5">
          Sistema Financeiro<br />
          <em>MDCA</em>
        </h2>
        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
          Controle projetos, convênios e fluxo de caixa da sua ONG com clareza e segurança — do lançamento à prestação de contas.
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        {[
          { icon: "◆", text: "Controle de projetos e fontes de recursos" },
          { icon: "◆", text: "Fluxo de caixa e conciliação bancária" },
          { icon: "◆", text: "Relatórios para prestação de contas" },
        ].map((item) => (
          <div key={item.text} className="flex items-start gap-3">
            <span className="text-[#0e7e6e] text-[8px] mt-1">{item.icon}</span>
            <span className="text-white/70 text-xs">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Sistema = "financeiro" | "gestao";

const sistemasConfig: Record<Sistema, { label: string; sublabel: string; desc: string; accent: string; accentDim: string; ring: string }> = {
  financeiro: {
    label: "Sistema Financeiro MDCA",
    sublabel: "FINANCEIRO",
    desc: "Lançamentos, fluxo de caixa e prestação de contas",
    accent: "#0e7e6e",
    accentDim: "#0e7e6e1a",
    ring: "focus:ring-[#0e7e6e]/30 focus:border-[#0e7e6e]",
  },
  gestao: {
    label: "Sistema Gestão MDCA",
    sublabel: "GESTÃO",
    desc: "Projetos, equipes, metas e monitoramento de impacto",
    accent: "#1a3a6b",
    accentDim: "#1a3a6b1a",
    ring: "focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b]",
  },
};

function SistemaSelector({ value, onChange }: { value: Sistema; onChange: (s: Sistema) => void }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-2">Acessar sistema</p>
      <div className="grid grid-cols-2 gap-2">
        {(["financeiro", "gestao"] as Sistema[]).map((s) => {
          const cfg = sistemasConfig[s];
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={`relative flex flex-col items-start gap-1 px-4 py-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                active
                  ? "border-current bg-white shadow-sm"
                  : "border-[#d4dae7] bg-white/60 hover:bg-white hover:border-[#b0bac9]"
              }`}
              style={active ? { borderColor: cfg.accent, color: cfg.accent } : {}}
            >
              {active && (
                <span
                  className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: cfg.accent }}
                />
              )}
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] font-semibold" style={active ? { color: cfg.accent } : { color: "#6b7a99" }}>
                {cfg.sublabel}
              </span>
              <span className="text-xs font-semibold text-[#0f1e3d] leading-snug">{cfg.label}</span>
              <span className="text-[10px] text-[#6b7a99] leading-snug">{cfg.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LoginScreen({ goToCadastro }: { goToCadastro: () => void }) {
  const { login, loading, error } = useAuth();
  const [sistema, setSistema] = useState<Sistema>("financeiro");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const cfg = sistemasConfig[sistema];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, senha });
    } catch {
      // erro já fica disponível em `error`, vindo do contexto de autenticação
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[480px_1fr] bg-white">
      <AuthBrand />
      <div className="flex items-center justify-center px-8 py-12 bg-[#f4f6f9]">
        <div className="w-full max-w-sm">
          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <BussolaLogo size={24} />
            <span className="font-serif text-xl text-[#0f1e3d]">Financeiro MDCA</span>
            <span className="text-[10px] text-[#0e7e6e] font-mono uppercase tracking-widest">Sistema</span>
          </div>

          <h1 className="font-serif text-3xl text-[#0f1e3d] mb-1">Entrar</h1>
          <p className="text-sm text-[#6b7a99] mb-6">Selecione o sistema e acesse sua conta</p>

          <SistemaSelector value={sistema} onChange={setSistema} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-1.5">
                E-mail profissional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@organizacao.org.br"
                className={`w-full h-11 px-4 rounded-md border border-[#d4dae7] bg-white text-sm text-[#0f1e3d] placeholder-[#b0bac9] focus:outline-none focus:ring-2 transition-all ${cfg.ring}`}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 px-4 pr-11 rounded-md border border-[#d4dae7] bg-white text-sm text-[#0f1e3d] placeholder-[#b0bac9] focus:outline-none focus:ring-2 transition-all ${cfg.ring}`}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a99] hover:text-[#0f1e3d] transition-colors cursor-pointer"
                >
                  {showSenha ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  className="text-xs transition-colors cursor-pointer"
                  style={{ color: cfg.accent }}
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 -mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ background: cfg.accent }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando…
                </>
              ) : `Entrar no ${cfg.label}`}
            </button>
          </form>

          <p className="text-center text-xs text-[#6b7a99] mt-5">
            Ainda não tem uma conta?{" "}
            <button onClick={goToCadastro} className="text-[#0e7e6e] font-medium hover:underline cursor-pointer">
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export function CadastroScreen({ goToLogin }: { goToLogin: () => void }) {
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState({ nome: "", email: "", organizacao: "", cargo: "", senha: "", confirmSenha: "" });
  const [showSenha, setShowSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.senha !== form.confirmSenha) { setErroSenha(true); return; }
    setErroSenha(false);
    try {
      await register({
        nome: form.nome,
        email: form.email,
        organizacao: form.organizacao,
        cargo: form.cargo,
        senha: form.senha,
      });
    } catch {
      // erro já fica disponível em `error`, vindo do contexto de autenticação
    }
  };

  const cargos = [
    "Coordenador(a) Financeiro(a)",
    "Gestor(a) de Projetos",
    "Diretor(a) Executivo(a)",
    "Analista Financeiro(a)",
    "Contador(a)",
    "Assessor(a) Administrativo(a)",
    "Outro",
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[480px_1fr] bg-white">
      <AuthBrand />
      <div className="flex items-start justify-center px-8 py-10 bg-[#f4f6f9] overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <BussolaLogo size={24} />
            <span className="font-serif text-xl text-[#0f1e3d]">Financeiro MDCA</span>
            <span className="text-[10px] text-[#0e7e6e] font-mono uppercase tracking-widest">Sistema</span>
          </div>

          <h1 className="font-serif text-3xl text-[#0f1e3d] mb-1">Criar conta</h1>
          <p className="text-sm text-[#6b7a99] mb-7">Cadastre seu perfil profissional para começar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome completo">
              <input
                type="text"
                required
                value={form.nome}
                onChange={set("nome")}
                placeholder="Maria Oliveira"
                className={inputCls}
              />
            </Field>

            <Field label="E-mail profissional">
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="voce@organizacao.org.br"
                className={inputCls}
              />
            </Field>

            <Field label="Organização / ONG">
              <input
                type="text"
                required
                value={form.organizacao}
                onChange={set("organizacao")}
                placeholder="Instituto Esperança"
                className={inputCls}
              />
            </Field>

            <Field label="Cargo / função">
              <select
                required
                value={form.cargo}
                onChange={set("cargo")}
                className={inputCls + " text-[#0f1e3d] appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center]"}
              >
                <option value="">Selecionar…</option>
                {cargos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Senha">
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.senha}
                    onChange={set("senha")}
                    placeholder="Mín. 8 caracteres"
                    className={inputCls + (erroSenha ? " border-red-400 focus:ring-red-200 focus:border-red-400" : "")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a99] hover:text-[#0f1e3d] transition-colors cursor-pointer"
                  >
                    {showSenha
                      ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                      : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </Field>
              <Field label="Confirmar senha">
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  value={form.confirmSenha}
                  onChange={set("confirmSenha")}
                  placeholder="Repetir"
                  className={inputCls + (erroSenha ? " border-red-400 focus:ring-red-200 focus:border-red-400" : "")}
                />
              </Field>
            </div>
            {erroSenha && <p className="text-xs text-red-500 -mt-2">As senhas não coincidem.</p>}
            {error && <p className="text-xs text-red-500 -mt-2">{error}</p>}

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input type="checkbox" required className="mt-0.5 accent-[#0e7e6e] cursor-pointer" />
                <span className="text-xs text-[#6b7a99] leading-relaxed">
                  Concordo com os{" "}
                  <span className="text-[#1a3a6b] hover:text-[#0e7e6e] transition-colors underline decoration-dotted cursor-pointer">
                    Termos de Uso
                  </span>{" "}
                  e a{" "}
                  <span className="text-[#1a3a6b] hover:text-[#0e7e6e] transition-colors underline decoration-dotted cursor-pointer">
                    Política de Privacidade
                  </span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0e7e6e] hover:bg-[#0b6b5d] disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta…
                </>
              ) : "Criar minha conta"}
            </button>
          </form>

          <p className="text-center text-xs text-[#6b7a99] mt-5">
            Já tem uma conta?{" "}
            <button onClick={goToLogin} className="text-[#0e7e6e] font-medium hover:underline cursor-pointer">
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-11 px-4 rounded-md border border-[#d4dae7] bg-white text-sm text-[#0f1e3d] placeholder-[#b0bac9] focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/30 focus:border-[#1a3a6b] transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-widest text-[#6b7a99] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
