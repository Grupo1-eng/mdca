import { useState } from "react";
import { ApiErro, SENHA_DEMO } from "@/lib/gestao-api";
import { useStore } from "@/lib/store";
import { PERFIS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONTAS = [
  { email: "helena@mdca.org.br", perfil: "Coordenação" },
  { email: "fernanda@mdca.org.br", perfil: "Técnico – Serviço Social" },
  { email: "rafael@mdca.org.br", perfil: "Técnico – Psicologia" },
  { email: "marcos@mdca.org.br", perfil: "Educador" },
  { email: "lucas@mdca.org.br", perfil: "Administrativo" },
  { email: "paula@mdca.org.br", perfil: "Educador inativo" },
];

export function LoginScreen() {
  const { entrar, usuarios } = useStore();
  const [email, setEmail] = useState("helena@mdca.org.br");
  const [senha, setSenha] = useState(SENHA_DEMO);
  const [erro, setErro] = useState<string | null>(null);

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      entrar(email, senha);
      setErro(null);
    } catch (falha) {
      setErro(falha instanceof ApiErro ? falha.message : "Não foi possível entrar.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1e3d] px-4 py-10">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="card-surface space-y-4 p-6">
          <div className="flex items-center gap-3">
            <img src="/logo-mdca.png" alt="MDCA" className="size-12 rounded-full bg-white object-contain" />
            <div>
              <h1 className="text-xl font-semibold">Sistema de Gestão MDCA</h1>
              <p className="text-sm text-muted-foreground">Acesso individual por perfil</p>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">E-mail</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Senha</Label>
            <Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
          <p className="text-xs text-muted-foreground">
            Protótipo: a senha de demonstração é {SENHA_DEMO}. O contrato da API ainda não descreve login.
          </p>
        </form>
        <aside className="rounded-lg border border-white/10 p-6 text-white">
          <h2 className="text-sm font-semibold">Contas de demonstração</h2>
          <ul className="mt-3 space-y-2">
            {CONTAS.map((conta) => (
              <li key={conta.email}>
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10"
                  onClick={() => setEmail(conta.email)}
                >
                  <span className="block">{conta.perfil}</span>
                  <span className="text-xs text-white/70">{conta.email}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-white/60">
            {usuarios.filter((u) => u.situacao === "Ativo").length} usuários ativos · perfis{" "}
            {PERFIS.map((p) => p.nome).join(", ")}
          </p>
        </aside>
      </div>
    </div>
  );
}
