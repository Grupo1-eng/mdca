import { describe, expect, it } from "vitest";
import { formatarCelula, gerarPdf, textoPdf, type DocumentoPdf } from "./pdf";
import { nomeArquivo } from "./planilha";

/**
 * Textos gravados no PDF (sem compressão), na ordem. O jsPDF grava a fonte
 * padrão em WinAnsi (windows-1252): cada caractere da string devolvida é um
 * byte, decodificado aqui de volta para conferir acentos, "—", "›" e "•".
 */
const winAnsi = new TextDecoder("windows-1252");
function textos(pdf: string): string[] {
  return [...pdf.matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g)].map((m) => {
    const bruto = m[1].replace(/\\([()\\])/g, "$1");
    return winAnsi.decode(Uint8Array.from(bruto, (c) => c.charCodeAt(0)));
  });
}

const base: DocumentoPdf = {
  titulo: "Execução Orçamentária — Projeto Aprendiz",
  organizacao: "Movimento pelos Direitos da Criança e do Adolescente",
  filtros: ["Período: novembro de 2026"],
  usuario: "Maria da Silva",
  geradoEm: new Date(2026, 10, 19, 14, 32),
  blocos: [],
};

async function gerar(documento: Partial<DocumentoPdf>) {
  const doc = await gerarPdf({ ...base, ...documento }, { comprimir: false });
  return { doc, textos: textos(doc.output()) };
}

describe("formatarCelula", () => {
  it("formata dinheiro em reais, com sinal nos negativos e sem espaço especial", () => {
    expect(formatarCelula(1234.5, "dinheiro")).toBe("R$ 1.234,50");
    expect(formatarCelula(-80, "dinheiro")).toBe("-R$ 80,00");
  });

  it("formata percentual e mostra traço quando o número falta", () => {
    expect(formatarCelula(85, "percentual")).toBe("85%");
    expect(formatarCelula(null, "percentual")).toBe("—");
    expect(formatarCelula(null, "dinheiro")).toBe("—");
    expect(formatarCelula(null, "texto")).toBe("");
  });

  it("mantém texto como está, mesmo em coluna de dinheiro", () => {
    expect(formatarCelula("Sem orçamento", "dinheiro")).toBe("Sem orçamento");
  });
});

describe("textoPdf", () => {
  it("troca caracteres que a fonte padrão não tem", () => {
    expect(textoPdf("R$ 10 − 5")).toBe("R$ 10 - 5");
  });
});

describe("nomeArquivo", () => {
  it("usa a extensão pedida", () => {
    expect(nomeArquivo("Execução Orçamentária", new Date(2026, 10, 19), "pdf")).toBe("execucao-orcamentaria-2026-11-19.pdf");
  });
});

describe("gerarPdf", () => {
  it("abre com a organização, o título, os filtros e o rodapé de emissão", async () => {
    const { textos: t } = await gerar({});
    expect(t[0]).toBe("Movimento pelos Direitos da Criança e do Adolescente");
    expect(t).toContain("Período: novembro de 2026");
    expect(t).toContain("Gerado em 19/11/2026 14:32 por Maria da Silva");
    expect(t).toContain("Página 1 de 1");
  });

  it("omite a linha da organização quando ela não é conhecida", async () => {
    const { textos: t } = await gerar({ organizacao: null });
    expect(t[0]).toMatch(/^Execução Orçamentária/);
  });

  it("desenha indicadores, tabela com totais e notas", async () => {
    const { textos: t } = await gerar({
      blocos: [
        { tipo: "indicadores", itens: [{ rotulo: "Orçado", valor: "R$ 1.000,00" }, { rotulo: "Saldo", valor: "-R$ 50,00", tom: "negativo" }] },
        { tipo: "secao", titulo: "Orçado x realizado por categoria" },
        {
          tipo: "tabela",
          colunas: [{ titulo: "Categoria" }, { titulo: "Orçado", formato: "dinheiro" }, { titulo: "Execução", formato: "percentual" }],
          linhas: [["Pessoal › Salários", 1000, 105], ["Material", null, null]],
          totais: ["Total", 1000, 105],
          linhasEmAlerta: [0],
        },
        { tipo: "notas", titulo: "Critérios", itens: ["Realizado = saídas pagas."] },
      ],
    });
    expect(t).toEqual(expect.arrayContaining([
      "Orçado", "R$ 1.000,00", "-R$ 50,00",
      "Orçado x realizado por categoria",
      "Categoria", "Execução", "Material", "105%", "—", "Total",
      "Critérios", "Realizado = saídas pagas.",
    ]));
  });

  it("desenha campos como rótulo e valor", async () => {
    const { textos: t } = await gerar({
      blocos: [{ tipo: "campos", itens: [{ rotulo: "Vigência", valor: "01/01/2026 a 31/12/2026" }, { rotulo: "Tipo", valor: "Programa" }] }],
    });
    expect(t).toEqual(expect.arrayContaining(["Vigência", "01/01/2026 a 31/12/2026", "Tipo", "Programa"]));
  });

  it("mostra o texto de vazio quando a tabela não tem linhas", async () => {
    const { textos: t } = await gerar({
      blocos: [{ tipo: "tabela", colunas: [{ titulo: "Origem" }, { titulo: "Valor", formato: "dinheiro" }], linhas: [], vazio: "Nenhum lançamento no período." }],
    });
    expect(t).toContain("Nenhum lançamento no período.");
  });

  it("quebra tabelas longas em páginas, repetindo o título das colunas e numerando todas", async () => {
    const linhas = Array.from({ length: 120 }, (_, i) => [`Lançamento ${i + 1}`, i * 10]);
    const { doc, textos: t } = await gerar({
      blocos: [{ tipo: "tabela", colunas: [{ titulo: "Descrição" }, { titulo: "Valor", formato: "dinheiro" }], linhas }],
    });
    const paginas = doc.getNumberOfPages();
    expect(paginas).toBeGreaterThan(1);
    expect(t.filter((x) => x === "Descrição")).toHaveLength(paginas);
    expect(t).toContain(`Página ${paginas} de ${paginas}`);
    expect(t).toContain("Lançamento 120");
    // Páginas seguintes têm o cabeçalho resumido.
    expect(t).toContain("Movimento pelos Direitos da Criança e do Adolescente · Execução Orçamentária — Projeto Aprendiz");
  });

  it("não parte tabela pequena: ela vai inteira, com o título da seção, para a página seguinte", async () => {
    const grande = Array.from({ length: 30 }, (_, i) => [`Linha ${i + 1}`, i]);
    const pequena = Array.from({ length: 8 }, (_, i) => [`Pequena ${i + 1}`, i]);
    const colunas = [{ titulo: "Descrição" }, { titulo: "Valor", formato: "dinheiro" as const }];
    const { doc } = await gerar({
      blocos: [
        { tipo: "tabela", colunas, linhas: grande },
        { tipo: "secao", titulo: "Saídas por origem" },
        { tipo: "tabela", colunas, linhas: pequena },
      ],
    });
    // Conteúdo de cada página (sem compressão), para saber onde cada texto caiu.
    const paginas = (doc.internal as unknown as { pages: (string[] | null)[] }).pages.slice(1).map((p) => (p ?? []).join("\n"));
    const paginaDe = (texto: string) => paginas.findIndex((p) => p.includes(`(${texto}) Tj`));
    expect(paginaDe("Linha 30")).toBe(0);
    expect(paginaDe("Saídas por origem".replace("í", "\xed"))).toBe(1);
    expect(paginaDe("Pequena 1")).toBe(1);
    expect(paginaDe("Pequena 8")).toBe(1);
  });

  it("usa A4 deitado na orientação paisagem", async () => {
    const { doc } = await gerar({ orientacao: "paisagem" });
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(297);
  });
});
