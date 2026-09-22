# Sprint 1 — Módulo Gestão MDCA

Este diretório reúne a documentação referente à **Sprint 1 do módulo de Gestão** do sistema desenvolvido para a MDCA — Movimento pelos Direitos da Criança e do Adolescente.

O foco desta Sprint é entregar o primeiro núcleo funcional do módulo, priorizando as funcionalidades mais importantes para centralização das informações dos educandos e acompanhamento realizado pela equipe da instituição.

---

## Objetivo da Sprint 1

Entregar o núcleo inicial funcional do módulo de Gestão, permitindo:

- autenticação básica dos usuários;
- cadastro e manutenção dos educandos;
- registro de evoluções e atendimentos;
- registro e acompanhamento de encaminhamentos;
- organização dos compromissos da equipe através de uma agenda compartilhada.

A prioridade é concluir esses fluxos de ponta a ponta, antes de ampliar o sistema com funcionalidades secundárias e fazer a integração entre backend e frontend.

---

# User Stories da Sprint 1

## US01 — Cadastro e manutenção de educandos

**Como** profissional autorizado da MDCA,  
**quero** cadastrar, consultar, pesquisar e atualizar os dados dos educandos,  
**para que** suas informações fiquem centralizadas e disponíveis para acompanhamento.

### Critérios de aceitação

- usuários autorizados podem cadastrar um educando;
- educandos podem ser listados e pesquisados;
- é possível consultar os dados de um educando;
- usuários autorizados podem editar seus dados;
- CPF e NIS, quando informados, são utilizados para identificar possíveis duplicidades;
- a ausência de CPF ou NIS não impede o cadastro;
- um educando pode ser inativado sem exclusão do seu histórico;
- devem ser armazenados os principais dados pessoais, escolares, familiares, socioeconômicos e de saúde necessários ao atendimento;
- origem do encaminhamento e motivo de ingresso devem ser registrados quando estiverem disponíveis na modelagem da Sprint.

---

## US02 — Evoluções e encaminhamentos

**Como** profissional técnico da MDCA,  
**quero** registrar evoluções, atendimentos e encaminhamentos relacionados a um educando,  
**para que** o histórico do acompanhamento realizado permaneça documentado.

### Critérios de aceitação

- uma evolução deve estar vinculada a um educando;
- o profissional responsável pelo registro deve ser identificado;
- a evolução deve possuir data e hora;
- o histórico das evoluções deve ser consultável em ordem cronológica;
- deve ser possível registrar um encaminhamento;
- o encaminhamento deve possuir uma descrição do que foi realizado;
- deve ser possível registrar acompanhamentos posteriores;
- o acompanhamento pode informar situação e observações;
- o encaminhamento original não deve ser sobrescrito por acompanhamentos posteriores.

---

## US03 — Agenda compartilhada

**Como** membro da equipe da MDCA,  
**quero** registrar e consultar compromissos em uma agenda compartilhada,  
**para que** reuniões, atendimentos e demais compromissos da equipe fiquem organizados.

### Critérios de aceitação

- usuários autorizados podem criar compromissos;
- compromissos podem ser consultados;
- é possível consultar compromissos por período;
- compromissos podem ser editados;
- compromissos podem ser cancelados;
- o cancelamento não deve excluir o registro;
- deve ser possível diferenciar compromissos agendados, realizados e cancelados.

---

# Requisitos Funcionais da Sprint 1

## Educandos

**RF01** — Permitir o cadastro de educandos com os dados necessários ao acompanhamento realizado pela MDCA.

**RF02** — Permitir o registro dos principais dados pessoais, escolares, familiares, socioeconômicos e de saúde do educando.

**RF03** — Verificar possíveis cadastros duplicados utilizando CPF e/ou NIS quando esses identificadores forem informados.

**RF04** — Permitir listar, pesquisar e consultar educandos cadastrados.

**RF05** — Permitir editar os dados cadastrais de um educando.

**RF06** — Permitir inativar um educando sem remover seus registros históricos.

**RF07** — Permitir registrar origem do encaminhamento e motivo de ingresso, conforme disponibilidade da modelagem de dados desta Sprint.

## Evoluções e encaminhamentos

**RF08** — Permitir registrar evolução ou atendimento vinculado ao educando, profissional responsável e data/hora.

**RF09** — Permitir consultar o histórico cronológico das evoluções de um educando.

**RF10** — Permitir registrar encaminhamento relacionado ao acompanhamento de um educando.

**RF11** — Permitir registrar acompanhamentos posteriores de um encaminhamento.

**RF12** — Preservar o encaminhamento original e manter o histórico dos acompanhamentos realizados.

## Agenda

**RF13** — Permitir criar compromissos informando título ou tipo, data, horário e descrição.

**RF14** — Permitir consultar compromissos por período.

**RF15** — Permitir editar compromissos existentes.

**RF16** — Permitir cancelar compromissos sem excluir o registro.

**RF17** — Permitir identificar a situação do compromisso como agendado, realizado ou cancelado.

---

# Requisitos de apoio

Algumas funcionalidades são necessárias para o funcionamento das User Stories, mas não representam uma entrega principal isolada desta Sprint.

**RF18** — O sistema deve exigir autenticação individual para acesso ao módulo de Gestão.

**RF19** — Cada usuário deve possuir um perfil básico de acesso.

**RF20** — Registros técnicos devem manter a identificação do profissional responsável.

**RF21** — Usuários inativos não devem conseguir realizar novo login.

O controle detalhado de acesso baseado na responsabilidade individual por cada caso poderá ser aprofundado em Sprints posteriores.

---

# Regras de Negócio

**RN01 — Inativação de educando**  
A inativação de um educando não deve remover evoluções, encaminhamentos ou outros registros históricos relacionados.

**RN02 — Duplicidade de cadastro**  
CPF e NIS somente devem participar da verificação de duplicidade quando forem informados. A ausência desses identificadores não impede o cadastro.

**RN03 — Autoria da evolução**  
Toda evolução deve permanecer vinculada ao educando, ao profissional responsável e à data/hora do registro.

**RN04 — Histórico de encaminhamento**  
Novos acompanhamentos não devem substituir ou excluir o encaminhamento original.

**RN05 — Cancelamento de compromisso**  
Um compromisso cancelado deve permanecer registrado com a situação de cancelado e não deve ser tratado como realizado.

**RN06 — Usuário inativo**  
Usuários inativos não devem conseguir realizar novo login no sistema.

**RN07 — Responsabilidade pelos registros técnicos**  
Registros técnicos devem preservar a identificação do profissional responsável por sua criação.

---

# Requisitos Não-Funcionais

**RNF01 — Plataforma**  
O sistema deve funcionar como aplicação web, com uso principal em computadores da instituição.

**RNF02 — Usabilidade**  
A interface deve ser simples, consistente e compreensível para usuários com conhecimentos básicos de informática.

**RNF03 — Segurança**  
O módulo deve exigir autenticação e aplicar as permissões básicas previstas para os perfis disponíveis nesta Sprint.

**RNF04 — Privacidade**  
Dados pessoais e sensíveis devem ser acessados somente pelos usuários autorizados para as funcionalidades implementadas.

**RNF05 — Integridade**  
Registros de evolução e acompanhamento devem preservar autoria, vínculo com o educando e data/hora.

**RNF06 — Compatibilidade**  
O sistema deve funcionar nos navegadores desktop modernos utilizados pela instituição.

---

# Fora do escopo da Sprint 1

Os itens abaixo fazem parte da evolução do módulo de Gestão, porém não são compromisso de entrega desta Sprint:

- importação de arquivos;
- painel de indicadores;
- exportação de dados em CSV ou PDF;
- atividades completas;
- encontros;
- controle completo de frequência;
- histórico completo de participação em atividades;
- administração completa de projetos, serviços e programas;
- auditoria completa;
- controle avançado de acesso baseado na responsabilidade sobre cada caso;
- relatórios avançados.

Algumas estruturas relacionadas a essas funcionalidades podem já existir no banco de dados ou no backend.

A existência dessas estruturas não significa que a funcionalidade esteja concluída ou faça parte da entrega da Sprint 1.

---

# Pontos técnicos a revisar durante a Sprint 1

Antes da conclusão da Sprint, devem ser verificados principalmente:

1. campos necessários no cadastro do educando;
2. origem do encaminhamento e motivos de ingresso;
3. armazenamento da descrição/conteúdo dos encaminhamentos;
4. permissões das rotas utilizadas nesta Sprint;
5. exposição desnecessária de dados sensíveis;
6. consistência entre banco de dados, Prisma e migrations;
7. consistência entre documentação e rotas reais da API;
8. integração entre frontend e backend;
9. testes mínimos dos principais fluxos implementados.

---

# Critério de conclusão da Sprint 1

A Sprint 1 será considerada concluída quando os principais fluxos estiverem funcionando de ponta a ponta:

**Autenticação → Educando → Evolução/Encaminhamento → Agenda**

A entrega deve possuir:

- persistência correta dos dados;
- validações básicas;
- preservação do histórico;
- identificação dos usuários responsáveis;
- permissões básicas;
- integração necessária entre banco de dados, backend e frontend;
- testes mínimos dos principais fluxos entregues.

O objetivo é finalizar um núcleo pequeno, funcional e consistente antes de ampliar o módulo.

---

# Planejamento inicial — Sprint 2

O escopo definitivo da Sprint 2 ainda deverá passar por refinamento com a equipe.

Considerando a evolução natural do módulo de Gestão, os principais candidatos para a próxima Sprint são os seguintes.

## 1. Atividades, encontros e frequência

Esta deve ser uma das principais evoluções após a conclusão do cadastro e acompanhamento dos educandos.

Funcionalidades previstas:

- cadastrar atividades;
- vincular uma atividade a um responsável;
- relacionar atividades a projetos, serviços ou programas;
- associar educandos participantes;
- registrar encontros de uma atividade;
- informar data, horário, local e situação do encontro;
- registrar presença ou ausência dos educandos;
- consultar o histórico de frequência por educando;
- preservar encontros e frequências históricos.

---

## 2. Projetos, serviços e programas

Evoluir a organização dos registros da Gestão permitindo distinguir as iniciativas mantidas pela MDCA.

Funcionalidades previstas:

- identificar se o registro representa Projeto, Serviço ou Programa;
- cadastrar ou consultar iniciativas disponíveis;
- vincular educandos às iniciativas;
- vincular atividades às iniciativas;
- vincular evoluções e atendimentos quando aplicável;
- permitir futuros filtros utilizando a mesma identificação.

A modelagem deve permanecer compatível com o módulo Financeiro e evitar duplicação desnecessária das entidades compartilhadas.

---

## 3. Evolução do controle de acesso

Aprofundar as permissões iniciadas na Sprint 1.

Possíveis melhorias:

- restringir registros técnicos por perfil;
- considerar responsabilidade sobre o caso;
- limitar dados sensíveis exibidos para educadores e administrativos;
- revisar permissões de criação, edição e consulta;
- melhorar a rastreabilidade das ações dos usuários.

---

## 4. Auditoria

Implementar registro automático das operações mais importantes realizadas sobre dados sensíveis.

Exemplos:

- usuário responsável;
- ação executada;
- recurso afetado;
- data e hora;
- identificação do registro alterado.

A auditoria deve ser gerada internamente pelo sistema e não depender de criação manual pelo usuário.

---

## 5. Indicadores básicos

Caso atividades e frequência estejam suficientemente estabilizadas durante a Sprint 2, pode ser iniciado o desenvolvimento de indicadores básicos.

Possíveis indicadores:

- quantidade de educandos atendidos;
- quantidade de evoluções/atendimentos;
- quantidade de encontros realizados;
- frequência dos educandos;
- filtros básicos por período.

O painel completo e as exportações podem permanecer para uma Sprint posterior caso não seja possível concluir essa parte com qualidade.

---

# Itens que não são prioridade inicial da Sprint 2

Salvo nova decisão da equipe durante o refinamento, não devem ser priorizados antes da estabilização dos fluxos principais:

- importador de arquivos;
- relatórios avançados;
- exportações complexas;
- funcionalidades administrativas que não estejam diretamente relacionadas ao núcleo da Gestão.

Esses itens permanecem no backlog e podem ser planejados em Sprints posteriores.

---

# Direção de evolução do módulo

A evolução planejada pode ser resumida da seguinte forma:

**Sprint 1**

Autenticação  
→ Educandos  
→ Evoluções e encaminhamentos  
→ Agenda

**Sprint 2**

Atividades  
→ Encontros  
→ Frequência  
→ Projetos/Serviços/Programas  
→ Refinamento de permissões e auditoria

**Sprints posteriores**

Indicadores completos  
→ Relatórios  
→ Exportações  
→ Importação de dados  
→ Funcionalidades adicionais identificadas no backlog

---

# Observações

O escopo de cada Sprint deve ser revisado antes do início do desenvolvimento.

Funcionalidades já iniciadas tecnicamente não são consideradas concluídas apenas por possuírem entidades, rotas ou estruturas de banco de dados.

Uma funcionalidade deve ser considerada entregue somente quando estiver integrada, validada e utilizável dentro do fluxo previsto para a Sprint.

Alterações relevantes no escopo devem ser refletidas nesta documentação e nos demais artefatos do projeto.