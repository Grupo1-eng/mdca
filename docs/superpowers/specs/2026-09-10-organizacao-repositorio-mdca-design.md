# Organização do Repositório MDCA — Design

**Data:** 2026-09-10

## Objetivo

Organizar o repositório compartilhado da MDCA para que os grupos financeiro e gestão possam trabalhar no mesmo código, com responsabilidades claras, documentação útil para pessoas e IAs e uma base preparada para um backend NestJS + Prisma + PostgreSQL/Neon.

Esta etapa é documental e estrutural. Ela não implementa endpoints, entidades Prisma, migrations nem mudanças no frontend.

## Contexto

O repositório será usado por dois grupos:

- **Financeiro:** responsável pelo desenvolvimento do módulo financeiro.
- **Gestão:** responsável pelo desenvolvimento do módulo de gestão.

Os dois grupos usarão:

- um único repositório;
- um único backend NestJS em TypeScript;
- um único banco PostgreSQL hospedado no Neon;
- um único schema Prisma e suas migrations;
- o mesmo frontend, cuja tecnologia atual é React + Vite + Tailwind CSS e ainda poderá ser decidida/ajustada.

O frontend atual em `frontend/SistemaFinanceiro/` é uma base funcional/prototípica do módulo financeiro. Sua configuração atual não deve ser movida nesta etapa.

O conteúdo antigo de `backend/` relacionado a uma API FastAPI de cadastro de produtos está fora do escopo. Os arquivos apagados localmente não devem ser restaurados nem usados como base da nova arquitetura.

## Arquitetura proposta

O backend será uma única aplicação NestJS com separação de módulos por domínio:

```text
backend/
  src/
    app.module.ts
    common/
    prisma/
    modules/
      financeiro/
      gestao/
    main.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  test/
    financeiro/
    gestao/
```

`backend/src/modules/financeiro/` permanecerá vazio por enquanto, exceto pelo marcador necessário para o Git versionar a área. Não serão criadas subpastas internas nem endpoints antes de a divisão do módulo financeiro ser decidida.

`backend/src/modules/gestao/` será reservado para o trabalho do grupo de gestão. Sua organização interna também não será presumida nesta etapa.

O diretório `common/` conterá somente infraestrutura compartilhada. O diretório `prisma/` concentrará a integração com o Prisma. O `schema.prisma` será único porque os grupos compartilham o banco, mesmo quando cada grupo é dono de tabelas e endpoints diferentes.

## Organização da documentação

```text
README.md
AGENTS.md
CLAUDE.md
HANDOFF.md

docs/
  README.md
  produto.md
  arquitetura.md
  decisoes.md
  financeiro/
    README.md
    modelo-dados.md
    regras-de-negocio.md
    perguntas-em-aberto.md
  gestao/
    README.md

backend/
  README.md
  AGENTS.md
  CLAUDE.md

frontend/
  README.md
  AGENTS.md
```

### Documentos da raiz

`README.md` será a entrada para qualquer pessoa: explicará o produto, os dois grupos, a stack, o estado atual, os comandos relevantes e os links para os documentos detalhados.

`AGENTS.md` será a entrada para agentes de código. Ele terá o mapa do repositório, a ordem de leitura, as responsabilidades por domínio, as regras do banco compartilhado e os limites do que ainda não foi decidido.

`CLAUDE.md` apontará para `AGENTS.md`, evitando duplicação.

`HANDOFF.md` registrará apenas o estado temporário do trabalho: o que foi feito, o que está bloqueado e qual é o próximo passo. Decisões permanentes não ficarão somente nesse arquivo.

### Documentos compartilhados

`docs/produto.md` explicará o contexto da MDCA, o objetivo do sistema e os limites entre financeiro e gestão.

`docs/arquitetura.md` descreverá o backend NestJS, o Prisma, o PostgreSQL/Neon, o frontend atual e a divisão dos módulos por domínio.

`docs/decisoes.md` conterá decisões permanentes com data, contexto, decisão e consequência. Nesta etapa, deverá registrar pelo menos: repositório compartilhado, backend único, banco único, uso de NestJS + Prisma + PostgreSQL/Neon e separação por módulos de domínio.

### Documentos do financeiro

`docs/financeiro/README.md` será a entrada do módulo financeiro e apontará para o escopo, modelo, regras e pendências.

`docs/financeiro/modelo-dados.md` incorporará o modelo financeiro fornecido pelo responsável do grupo, incluindo as entidades, relacionamentos, tipos, regras de integridade, consultas esperadas, MVP e integrações.

`docs/financeiro/regras-de-negocio.md` extrairá as regras que o backend deverá preservar, sem transformar automaticamente essas regras em endpoints.

`docs/financeiro/perguntas-em-aberto.md` listará as decisões que ainda dependem dos stakeholders, como vigência do orçamento, múltiplas contas por projeto, caixa físico, transferências e relatórios.

### Documentos da gestão

`docs/gestao/README.md` reservará o espaço do grupo de gestão e deixará explícito que o domínio, as regras e os endpoints ainda serão documentados pelo grupo responsável.

### Documentos específicos de área

`backend/README.md` descreverá o backend novo, seus comandos esperados, configuração de ambiente, Prisma, migrations, banco Neon e testes. Como o backend ainda não foi implementado, o documento distinguirá setup planejado de comandos já disponíveis.

`backend/AGENTS.md` conterá regras para trabalhar no NestJS, Prisma, migrations, testes e módulos financeiro/gestão.

`backend/CLAUDE.md` apontará para `backend/AGENTS.md`.

`frontend/README.md` e `frontend/AGENTS.md` mapearão o frontend atual sem impor uma decisão definitiva sobre sua arquitetura futura. O `frontend/SistemaFinanceiro/AGENTS.md` existente continuará sendo a instrução específica do projeto gerado pelo Figma Make.

## Ownership e colaboração

| Área | Responsável principal | Regra |
| --- | --- | --- |
| `docs/financeiro/` | Grupo financeiro | O grupo mantém escopo, modelo e regras do financeiro. |
| `backend/src/modules/financeiro/` | Grupo financeiro | O grupo mantém seus endpoints e regras de aplicação. |
| `docs/gestao/` | Grupo de gestão | O grupo documenta seu domínio e suas decisões. |
| `backend/src/modules/gestao/` | Grupo de gestão | O grupo mantém seus endpoints e regras de aplicação. |
| `backend/src/common/` | Compartilhado | Mudanças devem evitar acoplamento desnecessário entre domínios. |
| `backend/src/prisma/` | Compartilhado | A integração com o Prisma é única. |
| `backend/prisma/schema.prisma` | Compartilhado | O schema representa o banco único. |
| `backend/prisma/migrations/` | Compartilhado | Migrations precisam ser coordenadas pelos dois grupos. |

Cada grupo poderá alterar seus próprios módulos sem modificar endpoints do outro. Uma dependência entre domínios deverá ser documentada em `docs/arquitetura.md` ou `docs/decisoes.md` antes de virar contrato de código.

## Fontes de verdade

As fontes de verdade, em ordem de responsabilidade, serão:

1. `backend/prisma/schema.prisma` para a estrutura implementada do banco;
2. código dos módulos para o comportamento efetivamente implementado;
3. documentação de domínio para intenção, regras e contexto;
4. `docs/decisoes.md` para o motivo de decisões permanentes;
5. `HANDOFF.md` somente para o estado transitório da sessão.

Quando código e documentação divergirem, a divergência deverá ser corrigida e registrada; a documentação não deve ser silenciosamente ignorada.

## Fluxo de leitura para agentes

Antes de alterar qualquer coisa, um agente deverá:

1. ler o `AGENTS.md` da raiz;
2. ler o `HANDOFF.md` se existir informação de trabalho em andamento;
3. identificar se a tarefa pertence ao financeiro, à gestão ou ao compartilhado;
4. ler o `AGENTS.md` da área correspondente;
5. carregar apenas os documentos de domínio necessários para a tarefa;
6. verificar o estado do Git e preservar alterações locais não relacionadas.

Uma tarefa que altere schema ou migration deverá consultar os dois domínios afetados, mesmo que a mudança tenha começado em apenas um grupo.

## Escopo da implementação desta especificação

Será implementado somente:

- documentação da raiz;
- documentação compartilhada;
- documentação inicial do financeiro;
- espaço documental da gestão;
- documentação e marcadores estruturais do backend novo;
- documentação do frontend atual;
- diretórios reservados para os módulos financeiro e gestão.

Não será implementado:

- endpoint financeiro ou de gestão;
- entidade ou migration Prisma;
- decisão sobre a divisão interna dos endpoints;
- mudança de framework do frontend;
- movimentação do frontend atual;
- restauração do backend FastAPI apagado;
- limpeza ou alteração das exclusões locais já existentes.

## Verificação

Depois da implementação, a verificação deverá incluir:

```bash
git diff --check
find . -maxdepth 4 -type f | sort
npm run build
```

Também deverá ser feita uma revisão manual para confirmar:

- links internos válidos;
- coerência entre `README.md`, `AGENTS.md` e `docs/arquitetura.md`;
- separação explícita entre financeiro e gestão;
- ausência de endpoints ou entidades inventados;
- ausência de referências ao backend legado como arquitetura atual;
- preservação das exclusões locais do usuário;
- build do frontend sem alteração comportamental.

## Resultado esperado

Ao final, uma pessoa ou IA deverá conseguir responder, apenas lendo a documentação inicial:

- o que é o projeto da MDCA;
- quais grupos trabalham no repositório;
- qual parte pertence a cada grupo;
- como os dois grupos compartilham NestJS, Prisma e PostgreSQL;
- onde ficam as fontes de verdade;
- quais decisões já foram tomadas;
- quais decisões ainda estão abertas;
- por onde começar uma tarefa sem ler o repositório inteiro.
