import type { IndicadoresCalculados } from "./gestao-api";

function csvCampo(valor: string | number) {
  const texto = String(valor ?? "");
  if (/[";\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

function secao(titulo: string, colunas: string[], linhas: (string | number)[][]) {
  const cabecalho = colunas.map(csvCampo).join(";");
  const corpo = linhas.map((linha) => linha.map(csvCampo).join(";")).join("\n");
  return `${titulo}\n${cabecalho}\n${corpo}`;
}

export function indicadoresParaCsv(dados: IndicadoresCalculados) {
  return [
    secao(
      "Indicadores",
      ["Indicador", "Valor"],
      [
        ["Educandos atendidos", dados.educandosAtendidos],
        ["Atendimentos registrados", dados.atendimentosRegistrados],
        ["Encontros realizados", dados.encontrosRealizados],
        ["Frequência média (%)", dados.frequenciaMedia],
      ],
    ),
    secao(
      "Educandos atendidos",
      ["Nome", "Iniciativa"],
      dados.educandos.map((e) => [e.nome, e.iniciativa]),
    ),
    secao(
      "Atendimentos registrados",
      ["Data", "Educando", "Profissional"],
      dados.atendimentos.map((a) => [a.data, a.educando, a.profissional]),
    ),
    secao(
      "Encontros realizados",
      ["Data", "Atividade", "Local"],
      dados.encontros.map((e) => [e.data, e.atividade, e.local]),
    ),
    secao(
      "Presenças",
      ["Encontro", "Educando", "Presença"],
      dados.presencas.map((p) => [p.encontro, p.educando, p.presenca]),
    ),
  ].join("\n\n");
}

const WIN: Record<string, string> = {
  á: "\\341",
  à: "\\340",
  ã: "\\343",
  â: "\\342",
  é: "\\351",
  ê: "\\352",
  í: "\\355",
  ó: "\\363",
  õ: "\\365",
  ô: "\\364",
  ú: "\\372",
  ç: "\\347",
  Á: "\\301",
  À: "\\300",
  Ã: "\\303",
  Â: "\\302",
  É: "\\311",
  Ê: "\\312",
  Í: "\\315",
  Ó: "\\323",
  Õ: "\\325",
  Ô: "\\324",
  Ú: "\\332",
  Ç: "\\307",
  "–": "-",
  "—": "-",
  "·": "-",
};

function pdfTexto(valor: string) {
  return valor
    .split("")
    .map((ch) => {
      if (ch === "\\") return "\\\\";
      if (ch === "(") return "\\(";
      if (ch === ")") return "\\)";
      if (WIN[ch]) return WIN[ch];
      if (ch.charCodeAt(0) > 126) return "?";
      return ch;
    })
    .join("");
}

function paginasPdf(linhas: string[]) {
  const porPagina = 46;
  const paginas: string[] = [];
  for (let i = 0; i < linhas.length; i += porPagina) {
    const fatia = linhas.slice(i, i + porPagina);
    const comandos = fatia
      .map((linha, indice) => `${indice === 0 ? "" : "T* "}(${pdfTexto(linha)}) Tj`)
      .join("\n");
    paginas.push(`BT /F1 11 Tf 40 800 Td 16 TL\n${comandos}\nET`);
  }
  if (paginas.length === 0) paginas.push("BT /F1 11 Tf 40 800 Td (Sem dados) Tj ET");
  return paginas;
}

export function indicadoresParaPdf(dados: IndicadoresCalculados, periodo: string) {
  const linhas = [
    "MDCA - Painel de indicadores",
    periodo,
    "",
    `Educandos atendidos: ${dados.educandosAtendidos}`,
    `Atendimentos registrados: ${dados.atendimentosRegistrados}`,
    `Encontros realizados: ${dados.encontrosRealizados}`,
    `Frequencia media: ${dados.frequenciaMedia}%`,
    "",
    "Educandos atendidos",
    ...dados.educandos.map((e) => `- ${e.nome} (${e.iniciativa})`),
    "",
    "Atendimentos registrados",
    ...dados.atendimentos.map((a) => `- ${a.data} | ${a.educando} | ${a.profissional}`),
    "",
    "Encontros realizados",
    ...dados.encontros.map((e) => `- ${e.data} | ${e.atividade} | ${e.local}`),
    "",
    "Presencas",
    ...dados.presencas.map((p) => `- ${p.encontro} | ${p.educando} | ${p.presenca}`),
  ];
  return escreverPdf(paginasPdf(linhas));
}

function escreverPdf(conteudos: string[]) {
  const kids: number[] = [];
  const partes: { id: number; corpo: string }[] = [];
  let id = 4;
  for (const conteudo of conteudos) {
    const streamId = id++;
    const pageId = id++;
    kids.push(pageId);
    partes.push({
      id: streamId,
      corpo: `<< /Length ${byteLength(conteudo)} >>\nstream\n${conteudo}\nendstream`,
    });
    partes.push({
      id: pageId,
      corpo: `<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Contents ${streamId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
    });
  }
  const todos = [
    { id: 1, corpo: `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>` },
    { id: 2, corpo: `<< /Type /Catalog /Pages 1 0 R >>` },
    { id: 3, corpo: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>` },
    ...partes,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of todos) {
    offsets[obj.id] = byteLength(pdf);
    pdf += `${obj.id} 0 obj\n${obj.corpo}\nendobj\n`;
  }
  const xref = byteLength(pdf);
  pdf += `xref\n0 ${todos.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= todos.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${todos.length + 1} /Root 2 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function byteLength(texto: string) {
  return new TextEncoder().encode(texto).length;
}

export function baixarArquivo(nome: string, conteudo: Blob) {
  const url = URL.createObjectURL(conteudo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}
