# Escopo da Sprint 1 — Gestão

Priorização do que o módulo de gestão implementa nesta sprint, por ordem de dependência técnica. A lista completa de US, RF, RN e RNF está no documento de requisitos (Sprint 0); aqui fica apenas o recorte da sprint e a razão de cada prioridade.

## Ordem de implementação

A ordem abaixo não segue a numeração das US: segue o que bloqueia o quê. Uma camada só começa quando a anterior tem o modelo de dados no `schema.prisma` aprovado.

### Camada 0 — Base compartilhada (bloqueia os dois grupos)

| Prioridade | US | RF | Por quê primeiro |
| --- | --- | --- | --- |
| 1 | US07 | RF20, RF21 | `ProjetoServicoPrograma` é referenciado por educando, atividade e evolução, e provavelmente também pelo financeiro. Sem essa entidade definida, qualquer outra modelagem precisa ser refeita. |
| 2 | US04 (parcial) | RF11, RF14 | `Usuario`, perfil e autenticação são infraestrutura compartilhada. Toda rota protegida e todo registro com autoria dependem disso. |

Da US04, nesta sprint entram apenas autenticação individual (RF11) e gestão de usuários/perfis (RF14). RF12 (restrição por responsabilidade sobre o caso) e RF13 (auditoria) ficam para depois — ver "Fora do escopo".

### Camada 1 — Núcleo do domínio

| Prioridade | US | RF | Por quê |
| --- | --- | --- | --- |
| 3 | US01 | RF01–RF05 | Prioridade número um declarada pela MDCA: centralizar os dados dos educandos. É também o CRUD mais extenso de modelar, então começa cedo. |

### Camada 2 — Dependem do educando existir (podem ser paralelizadas)

| Prioridade | US | RF | Observação |
| --- | --- | --- | --- |
| 4 | US02 | RF06–RF08 | Depende de `Educando` e `Usuario`. |
| 4 | US03 | RF09, RF10 | Depende de `Usuario`; vínculo com educando é opcional. |
| 4 | US06 | RF17–RF19 | Depende de `Educando` e `ProjetoServicoPrograma`. |

As três têm a mesma prioridade e nenhuma depende das outras: podem ser distribuídas entre os desenvolvedores de backend em paralelo assim que a Camada 1 estiver de pé (ver "Divisão da equipe" para a divisão específica).

### Camada 3 — Agregação

| Prioridade | US | RF | Por quê por último |
| --- | --- | --- | --- |
| 5 | US05 | RF15, RF16 | O painel agrega dados das camadas anteriores. Sem educandos, evoluções e encontros cadastrados não há o que filtrar, exportar ou contar. |

## Fora do escopo desta sprint

- **RF12 completo** — a checagem fina de responsabilidade sobre o caso (por exemplo, um técnico de psicologia acessar apenas os próprios atendimentos) fica para depois. Nesta sprint o controle é apenas por perfil (RBAC simples).
- **RF13 — auditoria** — implementação transversal, aplicada a gestão e financeiro. Precisa ser combinada com o outro grupo antes de entrar, provavelmente em `backend/src/common/`.
- **RNF04 — resiliência de conexão** — tratado no frontend, não no backend desta sprint.

## Divisão da equipe

Papéis atualizados: Guilherme Tavares (Scrum Master + Backend), Diogo (PO + Banco), Bruno (Banco), Guilherme Braun e Bernardo (Frontend), Gustavo e Pietro (Backend). Isso dá 3 pessoas de backend e 2 de banco nesta sprint, não 2 e 1 como antes.

**Banco — Diogo e Bruno:**
Diogo, mesmo dividido com o papel de PO, fecha a Camada 0 (`Usuario`, `ProjetoServicoPrograma`) o quanto antes — é o que bloqueia todo mundo, então não vale esperar confirmação da MDCA para modelar com o que já se tem (perfis inferidos, campos do Anexo A) e ajustar depois se necessário. Assim que a Camada 0 está no PR de revisão cruzada, Bruno segue para a Camada 1 (`Educando` e tabelas relacionadas) e depois Evolução, Agenda, Atividade/Encontro/Frequência, sem esperar a aprovação do PR anterior travar o restante da modelagem.

**Backend — Guilherme Tavares, Gustavo e Pietro:**
Guilherme Tavares, com menos tempo de código por causa do papel de SM, fecha autenticação e perfis (RF11/RF14) primeiro — é a peça mais isolada da Camada 0 do lado do backend. Assim que a Camada 1 (`Educando`) estiver modelada no banco, Gustavo e Pietro atacam juntos o CRUD de US01 (é o requisito mais extenso, compensa ter dois nele desde o início). Depois se dividem entre US02, US03 e US06 — três frentes independentes, dá para alternar conforme o ritmo de cada um. US05 fecha a sprint, com quem sobrar.

**Frontend — Guilherme Braun e Bernardo:**
Não esperam o backend terminar: usam `contratos-api.md` para montar `frontend/SistemaGestao` (ainda não existe, só o `SistemaFinanceiro`) com dados mockados desde o início. Seguem a mesma ordem do backend (educando → evolução/agenda/frequência → painel) e são responsáveis por RNF04 (preservar formulário até confirmação de salvamento) e RNF06 (identidade visual da MDCA).

**Scrum Master — Guilherme Tavares:**
Fora do código, a prioridade dele é destravar a conversa com o Financeiro sobre `ProjetoServicoPrograma`, a auditoria (RF13) e o formato de `Usuario` — sem isso, a Camada 0 não fecha. Também garante que PRs tocando `schema.prisma`, `src/common/` ou `src/prisma/` passem por revisão cruzada, e que ninguém (nem ele mesmo) acumule US demais.

### Tabela de dependência por camada

| Camada | O quê | Quem |
| --- | --- | --- |
| 0 | `Usuario`, `ProjetoServicoPrograma` | Diogo + Bruno (banco); Guilherme Tavares (auth/perfis) |
| 1 | `Educando` completo | Bruno (banco) → Gustavo + Pietro (back) |
| 2 | Evolução, Agenda, Atividades/Frequência | Bruno (banco, em sequência) → Gustavo/Pietro/Guilherme Tavares (back, paralelo) |
| 3 | Painel/indicadores | Quem sobrar no fim da sprint |

O gargalo real é a Camada 0: com Diogo dividido entre PO e Banco, ele e Bruno devem começar por aí no primeiro dia da sprint, antes de qualquer outra coisa.

## Critério de pronto

Uma US é considerada concluída no backend quando:

- as entidades estão no `schema.prisma` com migration aplicada;
- os endpoints correspondentes respondem conforme os DTOs documentados em `contratos-api.md`;
- as regras de negócio associadas (ver `regras-de-negocio.md`) estão no service, não no controller;
- as rotas estão protegidas pelo guard de perfil;
- existe ao menos um teste cobrindo o caminho principal e uma violação de regra de negócio.
