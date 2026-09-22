# Escopo — Sprint 1 — Gestão

## Objetivo

Entregar o núcleo inicial funcional do módulo de Gestão da MDCA, priorizando:

- cadastro e manutenção de educandos;
- evoluções e encaminhamentos;
- acompanhamento de encaminhamentos;
- agenda compartilhada;
- autenticação e perfis básicos necessários aos fluxos da Sprint.

---

## User Stories

### US01 — Cadastro e manutenção de educandos

Permitir cadastrar, consultar, pesquisar, editar e inativar educandos, preservando o histórico.

Inclui:

- dados pessoais;
- dados escolares;
- dados familiares;
- dados socioeconômicos;
- dados de saúde;
- verificação de duplicidade por CPF/NIS;
- origem e motivo de ingresso, quando suportados pela modelagem.

### US02 — Evoluções e encaminhamentos

Permitir:

- registrar evolução/atendimento;
- identificar educando e profissional responsável;
- manter data/hora;
- consultar histórico cronológico;
- registrar encaminhamento;
- acompanhar posteriormente sua situação;
- preservar o encaminhamento original.

### US03 — Agenda compartilhada

Permitir:

- criar compromissos;
- consultar por período;
- editar;
- cancelar sem excluir;
- diferenciar agendado, realizado e cancelado.

---

## Requisitos de apoio

- autenticação individual;
- perfis básicos;
- usuários inativos não realizam novo login;
- autoria dos registros técnicos;
- proteção básica dos dados sensíveis.

---

## Fora do escopo

Não fazem parte da entrega desta Sprint:

- importação de arquivos;
- atividades completas;
- encontros;
- frequência completa;
- painel e indicadores;
- exportação CSV/PDF;
- auditoria completa;
- administração completa de projetos/serviços/programas;
- controle avançado por responsabilidade do caso;
- relatórios avançados.