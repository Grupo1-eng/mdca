import type {
  EdicaoUsuario,
  NovoUsuario,
  Perfil,
  Usuario,
} from "@/types/financeiro"

export const SENHA_MINIMA = 8

export const rotuloPerfilGestao: Record<Perfil, string> = {
  coordenador: "Coordenação",
  tecnico_servico_social: "Técnico – Serviço Social",
  tecnico_psicologia: "Técnico – Psicologia",
  educador: "Educador",
  administrativo: "Administrativo",
  coordenador_financeiro: "Coordenação financeira",
  gestor_financeiro: "Gestão financeira",
  analista_financeiro: "Análise financeira",
}

// A coordenação administra os dois módulos, então cria perfis de ambos.
// O administrativo acessa os dois e fica no grupo da Gestão.
export const GRUPOS_PERFIL: { titulo: string; perfis: Perfil[] }[] = [
  {
    titulo: "Gestão",
    perfis: [
      "coordenador",
      "tecnico_servico_social",
      "tecnico_psicologia",
      "educador",
      "administrativo",
    ],
  },
  {
    titulo: "Financeiro",
    perfis: ["coordenador_financeiro", "gestor_financeiro", "analista_financeiro"],
  },
]

export function podeGerenciarUsuarios(perfil: Perfil | undefined): boolean {
  return perfil === "coordenador"
}

export interface FiltroUsuarios {
  busca: string
  perfil: "todos" | Perfil
  situacao: "todos" | "ativos" | "inativos"
}

export function filtrarUsuarios(
  usuarios: Usuario[],
  filtro: FiltroUsuarios,
): Usuario[] {
  const termo = filtro.busca.trim().toLocaleLowerCase("pt-BR")
  return usuarios
    .filter(
      (u) =>
        (termo === "" ||
          `${u.nome} ${u.email}`.toLocaleLowerCase("pt-BR").includes(termo)) &&
        (filtro.perfil === "todos" || u.perfil === filtro.perfil) &&
        (filtro.situacao === "todos" ||
          (filtro.situacao === "ativos") === u.ativo),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

export interface FormUsuario {
  id: number | null
  nome: string
  email: string
  perfil: Perfil
  senha: string
  confirmarSenha: string
}

export function formNovoUsuario(): FormUsuario {
  return {
    id: null,
    nome: "",
    email: "",
    perfil: "educador",
    senha: "",
    confirmarSenha: "",
  }
}

export function formDeUsuario(usuario: Usuario): FormUsuario {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    senha: "",
    confirmarSenha: "",
  }
}

// Devolve a mensagem do primeiro problema, ou null se o formulário está ok.
// Na edição, a senha em branco mantém a atual.
export function validarUsuario(form: FormUsuario): string | null {
  if (!form.nome.trim()) return "Informe o nome."
  if (!form.email.trim()) return "Informe o e-mail."
  const novo = form.id === null
  if (novo && !form.senha) return "Defina a senha inicial."
  if (form.senha && form.senha.length < SENHA_MINIMA)
    return `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`
  if (form.senha !== form.confirmarSenha) return "As senhas não coincidem."
  return null
}

// O backend não deixa mudar o próprio perfil: na própria conta, o perfil
// não é enviado.
export function paraNovoUsuario(form: FormUsuario): NovoUsuario {
  return {
    nome: form.nome.trim(),
    email: form.email.trim(),
    perfil: form.perfil,
    senha: form.senha,
  }
}

export function paraEdicaoUsuario(
  form: FormUsuario,
  propriaConta: boolean,
): EdicaoUsuario {
  const dados: EdicaoUsuario = {
    nome: form.nome.trim(),
    email: form.email.trim(),
  }
  if (!propriaConta) dados.perfil = form.perfil
  if (form.senha) dados.senha = form.senha
  return dados
}
