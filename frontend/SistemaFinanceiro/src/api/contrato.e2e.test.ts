// Teste de contrato contra um backend real: usa as mesmas funções de src/api
// que as telas usam, com fetch de verdade. Precisa de um banco com um usuário
// de coordenação (E2E_EMAIL/E2E_SENHA) e sem outros dados de teste:
//
//   VITE_API_URL=http://localhost:3000 E2E_EMAIL=... E2E_SENHA=... npx vitest run contrato.e2e
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EVENTO_SESSAO_EXPIRADA, getToken, setToken } from "./client";
import { login, me } from "./auth";
import { createConta, getContas, updateConta } from "./contas";
import { createCategoria, getCategorias } from "./categorias";
import { createProjeto } from "./projetos";
import { createLancamento, getLancamentos, updateLancamento } from "./lancamentos";
import { createContato } from "./contatos";
import { createFonte } from "./fontes";
import { createUsuario, getUsuarios, inativarUsuario, updateUsuario } from "./usuarios";
import { arvoreCategorias, dataDoLancamento } from "@/lib/aggregations";
import { formatDate } from "@/lib/format";

const email = process.env.E2E_EMAIL ?? "";
const senha = process.env.E2E_SENHA ?? "";

describe.skipIf(!process.env.VITE_API_URL)("contrato com o backend real", () => {
  beforeAll(() => {
    const armazenado = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => armazenado.get(k) ?? null,
      setItem: (k: string, v: string) => armazenado.set(k, v),
      removeItem: (k: string) => armazenado.delete(k),
    });
    vi.stubGlobal("window", new EventTarget());
  });

  it("recusa senha errada com a mensagem do backend", async () => {
    await expect(login({ email, senha: "senha-errada" })).rejects.toThrow("E-mail ou senha inválidos.");
  });

  it("faz login (e-mail com maiúsculas) e consulta /me", async () => {
    const res = await login({ email: email.toUpperCase(), senha });
    setToken(res.accessToken);
    expect(res.usuario.email).toBe(email);
    expect(await me()).toEqual(res.usuario);
  });

  let contaId = 0;
  let categoriaId = 0;
  let projetoId = 0;

  it("cria conta na organização do token, com saldo exato", async () => {
    const conta = await createConta({ nome: "Conta e2e", tipo: "Conta Corrente", banco: "BRB", saldoInicial: "1000.10", saldoAtual: "1000.10" });
    contaId = conta.id;
    expect(conta.saldoInicial).toBe(1000.1);
    expect(conta.organizacaoId).toBe((await getContas()).find(c => c.id === conta.id)!.organizacaoId);

    const editada = await updateConta(conta.id, { banco: null, ativa: false });
    expect(editada.banco).toBeNull();
    expect(editada.ativa).toBe(false);
  });

  it("cria categoria e subcategoria e monta a árvore", async () => {
    const pai = await createCategoria({ nome: "Pessoal e2e", tipo: "despesa" });
    const sub = await createCategoria({ nome: "Salários e2e", tipo: "despesa", categoriaPaiId: pai.id });
    categoriaId = sub.id;
    const no = arvoreCategorias(await getCategorias()).find(n => n.categoria.id === pai.id);
    expect(no?.subcategorias.map(s => s.id)).toEqual([sub.id]);
  });

  it("cria projeto com datas e orçamento", async () => {
    const projeto = await createProjeto({ nome: "Projeto e2e", tipo: "PROJETO", status: "Planejamento", orcamentoTotal: "5000", dataInicio: "2026-09-01" });
    projetoId = projeto.id;
    expect(projeto.orcamentoTotal).toBe(5000);
    expect(formatDate(projeto.dataInicio)).toBe("01/09/2026");
  });

  it("cria, lista e atualiza lançamento", async () => {
    const criado = await createLancamento({
      contaId, categoriaId, projetoId, valor: "150.75", tipo: "saida",
      situacao: "pago", descricao: "Lançamento e2e", dataCompetencia: "2026-09-01",
    });
    expect(criado.valor).toBe(150.75);
    expect(formatDate(dataDoLancamento(criado))).toBe("01/09/2026");

    expect((await getLancamentos()).some(l => l.id === criado.id)).toBe(true);

    const atualizado = await updateLancamento(criado.id, { situacao: "pendente" });
    expect(atualizado.situacao).toBe("pendente");
  });

  it("mostra o erro de validação do backend para valor inválido", async () => {
    await expect(
      createLancamento({ contaId, categoriaId, valor: "10,50", tipo: "saida" }),
    ).rejects.toThrow(/valor/);
  });

  it("cria contato e fonte com os campos do banco", async () => {
    const contato = await createContato({ nome: "Instituto e2e", papel: "Financiador", tipo: "Pessoa jurídica", cpfCnpj: "00.000.000/0001-00" });
    expect(contato.papel).toBe("Financiador");
    const fonte = await createFonte({ nome: "Convênio e2e", origem: "Gov. Distrital" });
    expect(fonte.ativa).toBe(true);
  });

  it("coordenação cria usuário, que entra com a senha inicial", async () => {
    const tokenCoordenacao = getToken()!;
    const criado = await createUsuario({ nome: "Educadora", email: "educadora@mdca.org.br", senha: "senha-inicial", perfil: "educador" });
    expect(criado.ativo).toBe(true);
    expect((await getUsuarios()).map(u => u.email)).toContain("educadora@mdca.org.br");

    const sessao = await login({ email: "educadora@mdca.org.br", senha: "senha-inicial" });
    expect(sessao.usuario.perfil).toBe("educador");

    // Educadora não gerencia usuários.
    setToken(sessao.accessToken);
    await expect(createUsuario({ nome: "X", email: "x@mdca.org.br", senha: "senha-qualquer", perfil: "educador" }))
      .rejects.toThrow("Perfil sem permissão para esta operação.");

    setToken(tokenCoordenacao);
  });

  it("coordenação não consegue se trancar para fora", async () => {
    const eu = await me();
    await expect(inativarUsuario(eu.id)).rejects.toThrow("Você não pode inativar a própria conta.");
    await expect(updateUsuario(eu.id, { perfil: "administrativo" })).rejects.toThrow("Você não pode alterar o próprio perfil.");
  });

  it("usuário inativado não entra mais; reativado volta a entrar", async () => {
    const educadora = (await getUsuarios()).find(u => u.email === "educadora@mdca.org.br")!;
    await inativarUsuario(educadora.id);
    await expect(login({ email: "educadora@mdca.org.br", senha: "senha-inicial" })).rejects.toThrow("E-mail ou senha inválidos.");

    await updateUsuario(educadora.id, { ativo: true });
    expect((await login({ email: "educadora@mdca.org.br", senha: "senha-inicial" })).usuario.id).toBe(educadora.id);
  });

  it("e-mail repetido é recusado", async () => {
    await expect(createUsuario({ nome: "Outra", email: "EDUCADORA@mdca.org.br", senha: "senha-qualquer", perfil: "educador" }))
      .rejects.toThrow();
  });

  it("com token inválido, encerra a sessão", async () => {
    setToken("token-invalido");
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);

    await expect(getContas()).rejects.toThrow();

    expect(getToken()).toBeNull();
    expect(ouvinte).toHaveBeenCalled();
  });

  it("bloqueia o login depois de 5 tentativas no mesmo minuto", async () => {
    const erros: string[] = [];
    for (let i = 0; i < 6; i++) {
      await login({ email, senha: "senha-errada" }).catch((e: Error) => erros.push(e.message));
    }
    expect(erros).toContain("Muitas tentativas. Aguarde um minuto e tente de novo.");
  });
});
