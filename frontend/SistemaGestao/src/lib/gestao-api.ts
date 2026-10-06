/**
 * Funções no formato dos endpoints de contratos-api.md, aplicadas ao estado em memória.
 *
 * Login e logout ainda não estão no contrato. A sessão fica só no navegador até o
 * backend publicar o endpoint. Registrar isso com o Scrum Master.
 */
import type {
  AcompanhamentoEncaminhamento,
  Atendimento,
  Atividade,
  Compromisso,
  Educando,
  Encaminhamento,
  Encontro,
  Iniciativa,
  Usuario,
} from "./mock-data";

export class ApiErro extends Error {
  status: 401 | 403 | 404 | 409;

  constructor(status: 401 | 403 | 404 | 409, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiErro";
  }
}

export const SENHA_DEMO = "mdca123";
export const SESSAO_CHAVE = "mdca-gestao-sessao";

export function autenticar(usuarios: Usuario[], email: string, senha: string): Usuario {
  const encontrado = usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!encontrado || encontrado.senha !== senha) {
    throw new ApiErro(401, "E-mail ou senha inválidos.");
  }
  if (encontrado.situacao !== "Ativo") {
    throw new ApiErro(403, "Usuário inativo não autentica. A autoria dos registros anteriores permanece.");
  }
  return encontrado;
}

function digitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function duplicataDe(
  educandos: Educando[],
  dados: Pick<Educando, "id" | "cpf" | "nis">,
): Educando | undefined {
  const cpf = digitos(dados.cpf);
  const nis = digitos(dados.nis);
  if (!cpf && !nis) return undefined;
  return educandos.find((e) => {
    if (e.id && e.id === dados.id) return false;
    const mesmoCpf = cpf.length > 0 && digitos(e.cpf) === cpf;
    const mesmoNis = nis.length > 0 && digitos(e.nis) === nis;
    return mesmoCpf || mesmoNis;
  });
}

export function postEducando(lista: Educando[], dados: Educando): Educando[] {
  const dup = duplicataDe(lista, dados);
  if (dup) {
    throw new ApiErro(
      409,
      `Já existe um educando com este CPF ou NIS (${dup.nome}). O cadastro não foi gravado.`,
    );
  }
  return [...lista, dados];
}

export function patchEducando(lista: Educando[], dados: Educando): Educando[] {
  if (!lista.some((e) => e.id === dados.id)) throw new ApiErro(404, "Educando não encontrado.");
  const dup = duplicataDe(lista, dados);
  if (dup) {
    throw new ApiErro(
      409,
      `Já existe um educando com este CPF ou NIS (${dup.nome}). A alteração não foi gravada.`,
    );
  }
  return lista.map((e) => (e.id === dados.id ? dados : e));
}

export function patchInativarEducando(lista: Educando[], id: string): Educando[] {
  if (!lista.some((e) => e.id === id)) throw new ApiErro(404, "Educando não encontrado.");
  return lista.map((e) =>
    e.id === id
      ? { ...e, situacaoVinculo: e.situacaoVinculo === "Ativo" ? "Inativo" : "Ativo" }
      : e,
  );
}

export function postEvolucao(lista: Atendimento[], dados: Atendimento): Atendimento[] {
  if (!dados.educandoId || !dados.profissional || !dados.dataHora) {
    throw new ApiErro(409, "Toda evolução precisa de educando, profissional responsável e data/hora.");
  }
  return [dados, ...lista];
}

export function postEncaminhamento(lista: Encaminhamento[], dados: Encaminhamento): Encaminhamento[] {
  if (!dados.educandoId || !dados.profissional || !dados.dataHora || !dados.destino.trim()) {
    throw new ApiErro(409, "O encaminhamento precisa de educando, profissional, data/hora e destino.");
  }
  return [dados, ...lista];
}

export function postAcompanhamento(
  lista: Encaminhamento[],
  id: string,
  acompanhamento: AcompanhamentoEncaminhamento,
): Encaminhamento[] {
  const atual = lista.find((e) => e.id === id);
  if (!atual) throw new ApiErro(404, "Encaminhamento não encontrado.");
  return lista.map((e) =>
    e.id === id ? { ...e, acompanhamentos: [...e.acompanhamentos, acompanhamento] } : e,
  );
}

export function postCompromisso(lista: Compromisso[], dados: Compromisso): Compromisso[] {
  if (!dados.titulo.trim() || !dados.data || !dados.responsavel) {
    throw new ApiErro(409, "O compromisso precisa de título, data e responsável.");
  }
  return [...lista, dados];
}

export function patchCompromisso(
  lista: Compromisso[],
  id: string,
  parcial: Pick<Compromisso, "titulo" | "data" | "horario" | "observacoes" | "local" | "tipo">,
): Compromisso[] {
  if (!lista.some((c) => c.id === id)) throw new ApiErro(404, "Compromisso não encontrado.");
  return lista.map((c) => (c.id === id ? { ...c, ...parcial } : c));
}

export function patchCancelarCompromisso(lista: Compromisso[], id: string): Compromisso[] {
  if (!lista.some((c) => c.id === id)) throw new ApiErro(404, "Compromisso não encontrado.");
  return lista.map((c) => (c.id === id ? { ...c, status: "Cancelado" } : c));
}

export function patchSituacaoCompromisso(
  lista: Compromisso[],
  id: string,
  status: Compromisso["status"],
): Compromisso[] {
  if (status === "Cancelado") return patchCancelarCompromisso(lista, id);
  if (!lista.some((c) => c.id === id)) throw new ApiErro(404, "Compromisso não encontrado.");
  return lista.map((c) => (c.id === id ? { ...c, status } : c));
}

export function postAtividade(lista: Atividade[], dados: Atividade): Atividade[] {
  if (!dados.nome.trim() || !dados.iniciativaId || !dados.responsavel.trim()) {
    throw new ApiErro(409, "A atividade precisa de nome, iniciativa e responsável.");
  }
  return [...lista, dados];
}

export function postEncontro(lista: Encontro[], dados: Encontro): Encontro[] {
  if (!dados.atividadeId || !dados.data) {
    throw new ApiErro(409, "O encontro precisa de atividade e data.");
  }
  return [dados, ...lista];
}

export function postFrequencia(
  lista: Encontro[],
  encontroId: string,
  participantes: { educandoId: string; presente: boolean; observacao?: string }[],
): Encontro[] {
  const encontro = lista.find((e) => e.id === encontroId);
  if (!encontro) throw new ApiErro(404, "Encontro não encontrado.");
  const porEducando = new Map(encontro.presencas.map((p) => [p.educandoId, p]));
  for (const participante of participantes) {
    const anterior = porEducando.get(participante.educandoId);
    porEducando.set(participante.educandoId, { ...anterior, ...participante });
  }
  return lista.map((e) =>
    e.id === encontroId ? { ...e, presencas: [...porEducando.values()] } : e,
  );
}

export function patchSituacaoEncontro(
  lista: Encontro[],
  encontroId: string,
  situacao: Encontro["situacao"],
): Encontro[] {
  if (!lista.some((e) => e.id === encontroId)) throw new ApiErro(404, "Encontro não encontrado.");
  return lista.map((e) => (e.id === encontroId ? { ...e, situacao } : e));
}

export function postIniciativa(lista: Iniciativa[], dados: Iniciativa): Iniciativa[] {
  if (!dados.nome.trim() || !dados.codigo.trim()) {
    throw new ApiErro(409, "A iniciativa precisa de nome e identificador.");
  }
  if (lista.some((i) => i.codigo.trim().toLowerCase() === dados.codigo.trim().toLowerCase() && i.id !== dados.id)) {
    throw new ApiErro(409, "Já existe uma iniciativa com este identificador.");
  }
  return [...lista, dados];
}

export function patchIniciativa(lista: Iniciativa[], dados: Iniciativa): Iniciativa[] {
  if (!lista.some((i) => i.id === dados.id)) throw new ApiErro(404, "Iniciativa não encontrada.");
  if (lista.some((i) => i.codigo.trim().toLowerCase() === dados.codigo.trim().toLowerCase() && i.id !== dados.id)) {
    throw new ApiErro(409, "Já existe uma iniciativa com este identificador.");
  }
  return lista.map((i) => (i.id === dados.id ? dados : i));
}

export function postUsuario(lista: Usuario[], dados: Usuario): Usuario[] {
  if (lista.some((u) => u.email.toLowerCase() === dados.email.trim().toLowerCase())) {
    throw new ApiErro(409, "Já existe um usuário com este e-mail.");
  }
  return [...lista, dados];
}

export function patchUsuario(lista: Usuario[], id: string, parcial: Partial<Usuario>): Usuario[] {
  if (!lista.some((u) => u.id === id)) throw new ApiErro(404, "Usuário não encontrado.");
  return lista.map((u) => (u.id === id ? { ...u, ...parcial, id: u.id } : u));
}

export interface FiltroIndicadores {
  inicio: string;
  fim: string;
  programaId: string;
}

export interface IndicadoresCalculados {
  educandosAtendidos: number;
  atendimentosRegistrados: number;
  encontrosRealizados: number;
  frequenciaMedia: number;
  educandos: { nome: string; iniciativa: string }[];
  atendimentos: { data: string; educando: string; profissional: string }[];
  encontros: { data: string; atividade: string; local: string }[];
  presencas: { encontro: string; educando: string; presenca: string }[];
}

export function getIndicadores(
  estado: {
    educandos: Educando[];
    atendimentos: Atendimento[];
    encontros: Encontro[];
    atividades: Atividade[];
    iniciativas: Iniciativa[];
  },
  filtro: FiltroIndicadores,
): IndicadoresCalculados {
  const noPeriodo = (data: string) => data.slice(0, 10) >= filtro.inicio && data.slice(0, 10) <= filtro.fim;
  const nomeIniciativa = (id: string) => estado.iniciativas.find((i) => i.id === id)?.nome ?? "—";
  const nomeEducando = (id: string) => estado.educandos.find((e) => e.id === id)?.nome ?? "—";

  const educandosFiltrados = estado.educandos.filter(
    (e) => filtro.programaId === "todas" || e.iniciativaId === filtro.programaId,
  );
  const ids = new Set(educandosFiltrados.map((e) => e.id));
  const atendPeriodo = estado.atendimentos.filter(
    (a) => noPeriodo(a.dataHora) && ids.has(a.educandoId),
  );
  const atividadesFiltradas = estado.atividades.filter(
    (a) => filtro.programaId === "todas" || a.iniciativaId === filtro.programaId,
  );
  const encontrosPeriodo = estado.encontros.filter(
    (e) =>
      noPeriodo(e.data) &&
      e.situacao === "Realizado" &&
      atividadesFiltradas.some((a) => a.id === e.atividadeId),
  );
  const educandosAtendidosIds = [...new Set(atendPeriodo.map((a) => a.educandoId))];
  const presencas = encontrosPeriodo.flatMap((e) =>
    e.presencas.map((p) => ({
      encontro: `${e.data} ${e.horario}`,
      educando: nomeEducando(p.educandoId),
      presenca: p.presente ? "Presente" : "Ausente",
    })),
  );
  const presentes = presencas.filter((p) => p.presenca === "Presente").length;

  return {
    educandosAtendidos: educandosAtendidosIds.length,
    atendimentosRegistrados: atendPeriodo.length,
    encontrosRealizados: encontrosPeriodo.length,
    frequenciaMedia: presencas.length ? Math.round((presentes / presencas.length) * 100) : 0,
    educandos: educandosAtendidosIds.map((id) => {
      const edu = estado.educandos.find((e) => e.id === id);
      return { nome: edu?.nome ?? id, iniciativa: edu ? nomeIniciativa(edu.iniciativaId) : "—" };
    }),
    atendimentos: atendPeriodo.map((a) => ({
      data: a.dataHora,
      educando: nomeEducando(a.educandoId),
      profissional: a.profissional,
    })),
    encontros: encontrosPeriodo.map((e) => ({
      data: `${e.data} ${e.horario}`,
      atividade: estado.atividades.find((a) => a.id === e.atividadeId)?.nome ?? "—",
      local: e.local || "—",
    })),
    presencas,
  };
}
