# Decisões

Registro de decisões permanentes do projeto, com data, contexto, decisão e consequência.

## 2026-09-15 — Fluxo de branches e Pull Requests

**Contexto:** o repositório é compartilhado entre os grupos financeiro e gestão, com backend, banco e schema Prisma únicos. Já existiam branches separadas por grupo (`feature/gestao-frontend`, `feature/gestao-modulo-crud`).

**Decisão:** todo trabalho é feito em branches próprias, nomeadas `feature/<grupo>-<descricao-curta>` (ex.: `feature/financeiro-modelo-dados`, `feature/gestao-modulo-crud`), com `<grupo>` sendo `financeiro` ou `gestao`. Mudanças chegam ao `main` somente via Pull Request. PRs que tocam `backend/src/common/`, `backend/src/prisma/` ou `backend/prisma/schema.prisma` precisam de revisão de alguém do outro grupo, por afetarem código/banco compartilhado. Push direto no `main` deve ser evitado.

**Consequência:** o histórico do `main` fica revisado e as mudanças no schema/banco compartilhado passam pelos dois grupos antes de consolidar. PRs pequenos e frequentes são preferíveis a branches longas.
