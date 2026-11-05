# Decisões

Registro de decisões permanentes do projeto, com data, contexto, decisão e consequência.

## 2026-09-15 — Fluxo de branches e Pull Requests

**Contexto:** o repositório é compartilhado entre os grupos financeiro e gestão, com backend, banco e schema Prisma únicos. Já existiam branches separadas por grupo (`feature/gestao-frontend`, `feature/gestao-modulo-crud`).

**Decisão:** todo trabalho é feito em branches próprias, nomeadas `feature/<grupo>-<descricao-curta>` (ex.: `feature/financeiro-modelo-dados`, `feature/gestao-modulo-crud`), com `<grupo>` sendo `financeiro` ou `gestao`. Mudanças chegam ao `main` somente via Pull Request. PRs que tocam `backend/src/common/`, `backend/src/prisma/` ou `backend/prisma/schema.prisma` precisam de revisão de alguém do outro grupo, por afetarem código/banco compartilhado. Push direto no `main` deve ser evitado.

**Consequência:** o histórico do `main` fica revisado e as mudanças no schema/banco compartilhado passam pelos dois grupos antes de consolidar. PRs pequenos e frequentes são preferíveis a branches longas.

## 2026-11-04 — Isolamento por organização

**Contexto:** o sistema atende várias organizações (ONGs) no mesmo banco. As consultas de lançamentos e contas financeiras não filtravam por organização: um usuário via e alterava dados de todas. Ver o [registro de evolução](registro-de-evolucao.md).

**Decisão:** toda leitura e escrita de dados de uma organização filtra pelo `organizacaoId` do **token**, nunca por um valor vindo do corpo, da query ou da URL. Registro de outra organização responde **404**, como se não existisse, para não revelar que ele existe. Entidades sem `organizacao_id` próprio filtram pela relação que tem essa coluna (ex.: lançamento → `conta.organizacaoId`). Referências recebidas no corpo (`contaId`, `projetoId`...) são conferidas contra a organização do token antes de gravar. Todo endpoint novo deve ter um teste de integração mostrando que um usuário não acessa dados de outra organização.

**Consequência:** os services recebem `organizacaoId` como parâmetro, e os controllers o tiram de `@UsuarioAtual()`. Tabelas que ainda não têm vínculo com organização (categorias, contatos, fontes de recurso, orçamentos) precisam de migration antes de entrar nessa regra.
