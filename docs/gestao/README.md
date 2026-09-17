# Gestão

Entrada do módulo de gestão: acompanhamento dos educandos da MDCA, das famílias atendidas e do trabalho da equipe técnica.

O módulo cobre cadastro e manutenção de educandos, fichas de evolução e encaminhamentos, agenda compartilhada, atividades e frequência, e o painel de indicadores para prestação de contas — organizados por projeto, serviço ou programa.

## Documentos

- [`escopo-sprint1.md`](escopo-sprint1.md) — o que entra nesta sprint, em que ordem e por quê. Começar por aqui.
- [`modelo-dados.md`](modelo-dados.md) — entidades do domínio e o que precisa ser acordado com o financeiro antes de ir para o `schema.prisma`.
- [`regras-de-negocio.md`](regras-de-negocio.md) — as regras (RN01–RN11) e onde cada uma é aplicada no código.
- [`contratos-api.md`](contratos-api.md) — endpoints e perfis de acesso. É o contrato que permite ao frontend trabalhar em paralelo ao backend.
- [`perguntas-em-aberto.md`](perguntas-em-aberto.md) — decisões pendentes com a MDCA e com o grupo financeiro.

## Código

O módulo fica em `backend/src/modules/gestao/`. Alterações em `backend/prisma/schema.prisma`, `backend/src/common/` ou `backend/src/prisma/` exigem revisão de alguém do financeiro (ver [`docs/decisoes.md`](../decisoes.md)).

## Origem dos requisitos

Os requisitos vêm do questionário de elicitação respondido pela MDCA, das fichas de cadastro e evolução usadas hoje pela organização e da conversa com a representante. A numeração de US, RF, RN e RNF citada nestes documentos é a do documento de requisitos da Sprint 0.
