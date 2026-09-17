// Dados mock (Sprint 1) — nenhum backend real.

export type PerfilId =
  | "coordenacao"
  | "servico_social"
  | "psicologia"
  | "educador"
  | "administrativo";

export const PERFIS: { id: PerfilId; nome: string }[] = [
  { id: "coordenacao", nome: "Coordenação" },
  { id: "servico_social", nome: "Técnico – Serviço Social" },
  { id: "psicologia", nome: "Técnico – Psicologia" },
  { id: "educador", nome: "Educador" },
  { id: "administrativo", nome: "Administrativo" },
];

export type IniciativaTipo = "Projeto" | "Serviço" | "Programa";

export interface Iniciativa {
  id: string;
  codigo: string; // identificador único compartilhado com o Financeiro
  nome: string;
  tipo: IniciativaTipo;
  inicio?: string;
  fim?: string;
  situacao: "Ativo" | "Encerrado" | "Suspenso";
  origem: "Compartilhado com Financeiro" | "Somente Gestão";
}

export interface Educando {
  id: string;
  nome: string;
  nascimento: string;
  cpf: string;
  nis: string;
  genero: string;
  endereco: string;
  telefone: string;
  iniciativaId: string;
  dataIngresso: string;
  situacaoVinculo: "Ativo" | "Inativo";
  escola: string;
  serie: string;
  turno: string;
  responsavelNome: string;
  responsavelParentesco: string;
  responsavelTelefone: string;
  rendaFamiliar: string;
  pessoasCasa: number;
  beneficios: string;
  moradia: string;
  saudeObs: string; // sensível
  motivosIngresso: string[];
  origemEncaminhamento: string;
}

export const MOTIVOS_INGRESSO = [
  "Vulnerabilidade socioeconômica",
  "Evasão / baixa frequência escolar",
  "Situação de rua",
  "Violência intrafamiliar",
  "Trabalho infantil",
  "Uso de substâncias na família",
  "Demanda espontânea da família",
];

export const ORIGENS_ENCAMINHAMENTO = [
  "CRAS",
  "CREAS",
  "Conselho Tutelar",
  "Escola",
  "Unidade de Saúde",
  "Ministério Público",
  "Demanda espontânea",
];

export interface Atendimento {
  id: string;
  educandoId: string;
  profissional: string;
  perfilProfissional: string;
  dataHora: string;
  registro: string;
  intervencaoUsuario: string;
  intervencaoFamilia: string;
  sigiloso: boolean;
}

export type StatusEncaminhamento = "Pendente" | "Em andamento" | "Efetivado";

export interface Encaminhamento {
  id: string;
  educandoId: string;
  profissional: string;
  dataHora: string;
  destino: string;
  motivo: string;
  status: StatusEncaminhamento;
  acompanhamentos: { id: string; data: string; observacoes: string; status: StatusEncaminhamento }[];
}

export interface Atividade {
  id: string;
  nome: string;
  iniciativaId: string;
  responsavel: string;
  situacao: "Ativa" | "Encerrada";
  descricao: string;
}

export interface Encontro {
  id: string;
  atividadeId: string;
  data: string;
  horario: string;
  local: string;
  situacao: "Planejado" | "Realizado" | "Cancelado";
  observacoes: string;
  presencas: { educandoId: string; presente: boolean }[];
}

export interface Compromisso {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  local: string;
  responsavel: string;
  tipo: "Atendimento" | "Reunião" | "Visita domiciliar" | "Encontro de atividade";
  status: "Agendado" | "Realizado" | "Cancelado";
  observacoes: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilId;
  situacao: "Ativo" | "Inativo";
  organizacao: string;
}

export interface LogAuditoria {
  id: string;
  usuario: string;
  acao: string;
  recurso: string;
  dataHora: string;
}

const hoje = new Date();
const iso = (offsetDias: number) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
};

export const iniciativasSeed: Iniciativa[] = [
  {
    id: "ini-1",
    codigo: "PRJ-2026-001",
    nome: "Convivência e Fortalecimento de Vínculos",
    tipo: "Serviço",
    inicio: "2026-01-15",
    fim: "2026-12-20",
    situacao: "Ativo",
    origem: "Compartilhado com Financeiro",
  },
  {
    id: "ini-2",
    codigo: "PRJ-2026-002",
    nome: "Projeto Semear – Contraturno Escolar",
    tipo: "Projeto",
    inicio: "2026-02-01",
    fim: "2026-11-30",
    situacao: "Ativo",
    origem: "Compartilhado com Financeiro",
  },
  {
    id: "ini-3",
    codigo: "PRG-2025-007",
    nome: "Programa Jovem Aprendiz Cidadão",
    tipo: "Programa",
    inicio: "2025-03-01",
    situacao: "Ativo",
    origem: "Compartilhado com Financeiro",
  },
  {
    id: "ini-4",
    codigo: "PRJ-2024-011",
    nome: "Projeto Arte na Praça",
    tipo: "Projeto",
    inicio: "2024-03-01",
    fim: "2025-12-15",
    situacao: "Encerrado",
    origem: "Compartilhado com Financeiro",
  },
];

export const educandosSeed: Educando[] = [
  {
    id: "edu-1",
    nome: "Ana Beatriz Souza",
    nascimento: "2012-04-18",
    cpf: "123.456.789-00",
    nis: "1234567890",
    genero: "Feminino",
    endereco: "Rua das Acácias, 120 – Vila Nova",
    telefone: "(51) 99999-1010",
    iniciativaId: "ini-1",
    dataIngresso: "2026-02-10",
    situacaoVinculo: "Ativo",
    escola: "EMEF Presidente Vargas",
    serie: "7º ano",
    turno: "Manhã",
    responsavelNome: "Marli Souza",
    responsavelParentesco: "Mãe",
    responsavelTelefone: "(51) 98888-2020",
    rendaFamiliar: "Até 1 salário mínimo",
    pessoasCasa: 4,
    beneficios: "Bolsa Família",
    moradia: "Alugada",
    saudeObs: "Acompanhamento em saúde mental na UBS desde 2025.",
    motivosIngresso: ["Vulnerabilidade socioeconômica", "Evasão / baixa frequência escolar"],
    origemEncaminhamento: "CRAS",
  },
  {
    id: "edu-2",
    nome: "Carlos Eduardo Lima",
    nascimento: "2010-09-02",
    cpf: "987.654.321-00",
    nis: "9876543210",
    genero: "Masculino",
    endereco: "Av. Brasil, 45 – Centro",
    telefone: "(51) 99777-3030",
    iniciativaId: "ini-2",
    dataIngresso: "2026-03-05",
    situacaoVinculo: "Ativo",
    escola: "EEEF Castro Alves",
    serie: "9º ano",
    turno: "Tarde",
    responsavelNome: "Joana Lima",
    responsavelParentesco: "Avó",
    responsavelTelefone: "(51) 97777-4040",
    rendaFamiliar: "1 a 2 salários mínimos",
    pessoasCasa: 3,
    beneficios: "BPC",
    moradia: "Própria",
    saudeObs: "Uso contínuo de medicação para asma.",
    motivosIngresso: ["Vulnerabilidade socioeconômica"],
    origemEncaminhamento: "Escola",
  },
  {
    id: "edu-3",
    nome: "Juliana Ferreira",
    nascimento: "2009-01-27",
    cpf: "111.222.333-44",
    nis: "1122334455",
    genero: "Feminino",
    endereco: "Rua Cinco, 88 – Bairro Esperança",
    telefone: "(51) 96666-5050",
    iniciativaId: "ini-3",
    dataIngresso: "2025-08-11",
    situacaoVinculo: "Ativo",
    escola: "IFRS – Campus Central",
    serie: "1º ano EM",
    turno: "Noite",
    responsavelNome: "Paulo Ferreira",
    responsavelParentesco: "Pai",
    responsavelTelefone: "(51) 96666-6060",
    rendaFamiliar: "Até 1 salário mínimo",
    pessoasCasa: 5,
    beneficios: "Nenhum",
    moradia: "Cedida",
    saudeObs: "Sem restrições relatadas.",
    motivosIngresso: ["Trabalho infantil", "Vulnerabilidade socioeconômica"],
    origemEncaminhamento: "Conselho Tutelar",
  },
  {
    id: "edu-4",
    nome: "Miguel Antunes",
    nascimento: "2013-11-30",
    cpf: "555.666.777-88",
    nis: "5566778899",
    genero: "Masculino",
    endereco: "Travessa Sol, 12 – Vila Nova",
    telefone: "(51) 95555-7070",
    iniciativaId: "ini-1",
    dataIngresso: "2025-04-22",
    situacaoVinculo: "Inativo",
    escola: "EMEF Monteiro Lobato",
    serie: "6º ano",
    turno: "Manhã",
    responsavelNome: "Regina Antunes",
    responsavelParentesco: "Mãe",
    responsavelTelefone: "(51) 95555-8080",
    rendaFamiliar: "Sem renda formal",
    pessoasCasa: 6,
    beneficios: "Bolsa Família",
    moradia: "Alugada",
    saudeObs: "Encaminhado para avaliação neuropediátrica.",
    motivosIngresso: ["Violência intrafamiliar"],
    origemEncaminhamento: "CREAS",
  },
  {
    id: "edu-5",
    nome: "Sofia Nogueira",
    nascimento: "2011-06-14",
    cpf: "222.333.444-55",
    nis: "2233445566",
    genero: "Feminino",
    endereco: "Rua do Parque, 300 – Centro",
    telefone: "(51) 94444-9090",
    iniciativaId: "ini-2",
    dataIngresso: "2026-01-30",
    situacaoVinculo: "Ativo",
    escola: "EMEF Presidente Vargas",
    serie: "8º ano",
    turno: "Tarde",
    responsavelNome: "Cláudia Nogueira",
    responsavelParentesco: "Mãe",
    responsavelTelefone: "(51) 94444-1111",
    rendaFamiliar: "1 a 2 salários mínimos",
    pessoasCasa: 4,
    beneficios: "Nenhum",
    moradia: "Própria",
    saudeObs: "Alergia a lactose.",
    motivosIngresso: ["Demanda espontânea da família"],
    origemEncaminhamento: "Demanda espontânea",
  },
];

export const atendimentosSeed: Atendimento[] = [
  {
    id: "at-1",
    educandoId: "edu-1",
    profissional: "Fernanda Rocha",
    perfilProfissional: "Técnico – Serviço Social",
    dataHora: `${iso(-2)}T14:30`,
    registro: "Atendimento individual para acompanhamento da frequência escolar.",
    intervencaoUsuario: "Escuta qualificada e pactuação de metas semanais de presença.",
    intervencaoFamilia: "Contato telefônico com a mãe para alinhar rotina de estudos.",
    sigiloso: true,
  },
  {
    id: "at-2",
    educandoId: "edu-1",
    profissional: "Rafael Dias",
    perfilProfissional: "Técnico – Psicologia",
    dataHora: `${iso(-9)}T10:00`,
    registro: "Primeira escuta psicológica após encaminhamento da coordenação.",
    intervencaoUsuario: "Aplicação de dinâmica de reconhecimento de emoções.",
    intervencaoFamilia: "Orientação sobre rede de saúde mental do território.",
    sigiloso: true,
  },
  {
    id: "at-3",
    educandoId: "edu-2",
    profissional: "Fernanda Rocha",
    perfilProfissional: "Técnico – Serviço Social",
    dataHora: `${iso(-1)}T09:15`,
    registro: "Atualização cadastral e conversa sobre interesse no Jovem Aprendiz.",
    intervencaoUsuario: "Apresentação do fluxo do programa.",
    intervencaoFamilia: "Avó orientada sobre documentação necessária.",
    sigiloso: false,
  },
  {
    id: "at-4",
    educandoId: "edu-3",
    profissional: "Rafael Dias",
    perfilProfissional: "Técnico – Psicologia",
    dataHora: `${iso(-4)}T16:00`,
    registro: "Acompanhamento de rotina, sem intercorrências.",
    intervencaoUsuario: "Roda de conversa sobre projeto de vida.",
    intervencaoFamilia: "Sem intervenção familiar nesta data.",
    sigiloso: false,
  },
];

export const encaminhamentosSeed: Encaminhamento[] = [
  {
    id: "enc-1",
    educandoId: "edu-1",
    profissional: "Fernanda Rocha",
    dataHora: `${iso(-9)}T11:00`,
    destino: "UBS Vila Nova – Saúde Mental",
    motivo: "Necessidade de acompanhamento psicológico continuado.",
    status: "Em andamento",
    acompanhamentos: [
      {
        id: "acp-1",
        data: iso(-3),
        observacoes: "Consulta agendada pela unidade para a próxima semana.",
        status: "Em andamento",
      },
    ],
  },
  {
    id: "enc-2",
    educandoId: "edu-2",
    profissional: "Fernanda Rocha",
    dataHora: `${iso(-20)}T15:30`,
    destino: "CRAS Centro",
    motivo: "Atualização do CadÚnico da família.",
    status: "Efetivado",
    acompanhamentos: [
      { id: "acp-2", data: iso(-12), observacoes: "Família compareceu e cadastro foi atualizado.", status: "Efetivado" },
    ],
  },
  {
    id: "enc-3",
    educandoId: "edu-3",
    profissional: "Rafael Dias",
    dataHora: `${iso(-5)}T13:00`,
    destino: "Programa Jovem Aprendiz – empresa parceira",
    motivo: "Inclusão em vaga de aprendizagem.",
    status: "Pendente",
    acompanhamentos: [],
  },
];

export const atividadesSeed: Atividade[] = [
  {
    id: "atv-1",
    nome: "Oficina de Música",
    iniciativaId: "ini-1",
    responsavel: "Educador Marcos Reis",
    situacao: "Ativa",
    descricao: "Oficina semanal de percussão e canto coletivo.",
  },
  {
    id: "atv-2",
    nome: "Reforço Escolar – Matemática",
    iniciativaId: "ini-2",
    responsavel: "Educadora Paula Menezes",
    situacao: "Ativa",
    descricao: "Apoio pedagógico em contraturno.",
  },
  {
    id: "atv-3",
    nome: "Roda de Projeto de Vida",
    iniciativaId: "ini-3",
    responsavel: "Rafael Dias",
    situacao: "Ativa",
    descricao: "Encontros quinzenais com adolescentes do programa.",
  },
];

export const encontrosSeed: Encontro[] = [
  {
    id: "enco-1",
    atividadeId: "atv-1",
    data: iso(-3),
    horario: "14:00",
    local: "Sala de Oficinas",
    situacao: "Realizado",
    observacoes: "Ensaio para apresentação de encerramento do mês.",
    presencas: [
      { educandoId: "edu-1", presente: true },
      { educandoId: "edu-4", presente: false },
      { educandoId: "edu-5", presente: true },
    ],
  },
  {
    id: "enco-2",
    atividadeId: "atv-1",
    data: iso(-1),
    horario: "14:00",
    local: "Sala de Oficinas",
    situacao: "Realizado",
    observacoes: "",
    presencas: [
      { educandoId: "edu-1", presente: true },
      { educandoId: "edu-5", presente: true },
    ],
  },
  {
    id: "enco-3",
    atividadeId: "atv-2",
    data: iso(-2),
    horario: "09:00",
    local: "Sala 2",
    situacao: "Realizado",
    observacoes: "Revisão de frações.",
    presencas: [
      { educandoId: "edu-2", presente: true },
      { educandoId: "edu-5", presente: false },
    ],
  },
  {
    id: "enco-4",
    atividadeId: "atv-3",
    data: iso(2),
    horario: "18:30",
    local: "Auditório",
    situacao: "Planejado",
    observacoes: "Convidar egressos do programa.",
    presencas: [{ educandoId: "edu-3", presente: false }],
  },
];

export const compromissosSeed: Compromisso[] = [
  {
    id: "cmp-1",
    titulo: "Atendimento individual – Ana Beatriz",
    data: iso(0),
    horario: "14:00",
    local: "Sala Técnica 1",
    responsavel: "Fernanda Rocha",
    tipo: "Atendimento",
    status: "Agendado",
    observacoes: "Retorno sobre frequência escolar.",
  },
  {
    id: "cmp-2",
    titulo: "Reunião de equipe técnica",
    data: iso(0),
    horario: "16:30",
    local: "Sala de Reuniões",
    responsavel: "Coordenação",
    tipo: "Reunião",
    status: "Agendado",
    observacoes: "Pauta: casos em acompanhamento.",
  },
  {
    id: "cmp-3",
    titulo: "Visita domiciliar – família Antunes",
    data: iso(1),
    horario: "10:00",
    local: "Travessa Sol, 12",
    responsavel: "Fernanda Rocha",
    tipo: "Visita domiciliar",
    status: "Agendado",
    observacoes: "",
  },
  {
    id: "cmp-4",
    titulo: "Roda de Projeto de Vida",
    data: iso(2),
    horario: "18:30",
    local: "Auditório",
    responsavel: "Rafael Dias",
    tipo: "Encontro de atividade",
    status: "Agendado",
    observacoes: "",
  },
  {
    id: "cmp-5",
    titulo: "Atendimento – Carlos Eduardo",
    data: iso(-1),
    horario: "09:15",
    local: "Sala Técnica 2",
    responsavel: "Fernanda Rocha",
    tipo: "Atendimento",
    status: "Realizado",
    observacoes: "",
  },
  {
    id: "cmp-6",
    titulo: "Oficina de Música (extra)",
    data: iso(-2),
    horario: "15:00",
    local: "Sala de Oficinas",
    responsavel: "Marcos Reis",
    tipo: "Encontro de atividade",
    status: "Cancelado",
    observacoes: "Cancelado por falta de energia elétrica na sede.",
  },
];

export const usuariosSeed: Usuario[] = [
  { id: "usr-1", nome: "Helena Martins", email: "helena@mdca.org.br", perfil: "coordenacao", situacao: "Ativo", organizacao: "MDCA – Sede" },
  { id: "usr-2", nome: "Fernanda Rocha", email: "fernanda@mdca.org.br", perfil: "servico_social", situacao: "Ativo", organizacao: "MDCA – Sede" },
  { id: "usr-3", nome: "Rafael Dias", email: "rafael@mdca.org.br", perfil: "psicologia", situacao: "Ativo", organizacao: "MDCA – Sede" },
  { id: "usr-4", nome: "Marcos Reis", email: "marcos@mdca.org.br", perfil: "educador", situacao: "Ativo", organizacao: "MDCA – Sede" },
  { id: "usr-5", nome: "Paula Menezes", email: "paula@mdca.org.br", perfil: "educador", situacao: "Inativo", organizacao: "MDCA – Sede" },
  { id: "usr-6", nome: "Lucas Prado", email: "lucas@mdca.org.br", perfil: "administrativo", situacao: "Ativo", organizacao: "MDCA – Sede" },
];

export const logsSeed: LogAuditoria[] = [
  { id: "log-1", usuario: "Helena Martins", acao: "Alterou perfil de usuário", recurso: "Usuário: Lucas Prado", dataHora: `${iso(0)} 08:42` },
  { id: "log-2", usuario: "Fernanda Rocha", acao: "Criou ficha de evolução", recurso: "Educando: Ana Beatriz Souza", dataHora: `${iso(-2)} 14:55` },
  { id: "log-3", usuario: "Marcos Reis", acao: "Registrou frequência", recurso: "Encontro: Oficina de Música", dataHora: `${iso(-3)} 15:20` },
  { id: "log-4", usuario: "Helena Martins", acao: "Inativou educando", recurso: "Educando: Miguel Antunes", dataHora: `${iso(-15)} 11:03` },
  { id: "log-5", usuario: "Lucas Prado", acao: "Exportou indicadores (CSV)", recurso: "Painel de Indicadores", dataHora: `${iso(-6)} 17:11` },
];

export const hojeISO = iso(0);
export const diasRelativos = iso;
