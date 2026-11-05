# Registro de evolução

Histórico das correções, evoluções e manutenções do repositório: o que mudou, por que mudou e o que ficou pendente. Serve para quem chega depois (colegas, professores, agentes) entender a trajetória do trabalho sem ler o histórico do git inteiro.

- **Decisões permanentes** (regras que valem daqui em diante) ficam em [`decisoes.md`](decisoes.md); aqui só há um link para elas.
- **Estado temporário** (o que está em andamento agora) fica no [`HANDOFF.md`](../HANDOFF.md).

## Como registrar

Uma entrada por mudança relevante, **a mais recente no topo**, no formato:

```markdown
## AAAA-MM-DD — Título curto

**Tipo:** correção | evolução | manutenção · **Grupo:** financeiro | gestão | ambos · **PR:** #N (branch `feature/...`)

**O que mudou:** o comportamento novo, em poucas linhas.

**Por quê:** o problema ou o requisito (US/RF) que motivou.

**Pendências:** o que ficou de fora, ou "nenhuma".
```

---

## 2026-11-05 — Integridade do banco da gestão

**Tipo:** evolução · **Grupo:** gestão · **PR:** a abrir (branch `feature/gestao-integridade-banco`)

**O que mudou:** a migration `20261105120000_gestao_integridade` mexe só no schema `gestao`:
- coluna `criado_em` em educando, responsável familiar, evolução, encaminhamento, acompanhamento e compromisso. Nos registros antigos de evolução, encaminhamento e acompanhamento, ela é preenchida com a data do próprio registro;
- `data_nascimento` passa a `DATE` e `renda_familiar` a `DECIMAL(12,2)`;
- índices nas chaves estrangeiras e nas consultas de histórico e agenda;
- vínculo único educando + projeto;
- regras `CHECK`: textos obrigatórios não podem ser vazios, data de fim não pode ser anterior à de início, renda e número de pessoas da família não podem ser negativos ou zero.

**Por quê:** o banco aceitava dados que as regras da Sprint 1 não admitem (nome em branco, período invertido, vínculo repetido) e não guardava quando cada registro técnico foi criado (RNF05).

**Pendências:**
- as `CHECK` foram criadas como `NOT VALID`: valem para gravações novas, mas os dados antigos não foram conferidos. Rodar `VALIDATE CONSTRAINT` em cada uma depois de corrigir os registros que violarem;
- uma violação de `CHECK` hoje chega ao frontend como erro 500, porque o `PrismaExceptionFilter` não trata esse caso. Mapear para 400 é tarefa do backend;
- os valores de situação (`em andamento`/`Em andamento`/`pendente`) seguem em texto livre: antes de travar uma lista, frontend e backend precisam usar os mesmos valores.

## 2026-11-04 — Isolamento por organização em lançamentos e contas financeiras

**Tipo:** correção (segurança) · **Grupo:** financeiro · **PR:** #21 (branch `feature/financeiro-lancamentos-por-organizacao`)

**O que mudou:** listagem, busca, edição e exclusão de **lançamentos** e **contas financeiras**, e também o resumo semanal (US-10), passam a filtrar pela organização do usuário logado. Registros de outra organização respondem 404, como se não existissem. Criar ou editar um lançamento com `contaId` ou `projetoId` de outra organização também responde 404. Lançamento não tem `organizacao_id`: ele pertence à organização da sua conta, por isso o filtro é `conta.organizacaoId`. Teste em `backend/src/modules/financeiro/isolamento-organizacao.integration.spec.ts`.

**Por quê:** as consultas não filtravam nada. Um usuário de uma ONG via, editava e apagava os lançamentos e as contas de todas as outras, e o resumo semanal somava o dinheiro de todas. Ver a decisão [Isolamento por organização](decisoes.md#2026-11-04--isolamento-por-organização).

**Pendências:**
- `categorias-financeiras`, `contatos`, `fontes-de-recurso` e `orcamentos` não têm coluna `organizacao_id` no schema, então continuam compartilhados entre organizações. Corrigir exige migration e revisão da gestão.
- `projetos` (módulo compartilhado) grava a organização na criação, mas a listagem, a busca, a edição e a exclusão não filtram por ela.
- ~~O PR #20 (auditoria) mexe nos mesmos services.~~ Resolvido no merge do `main` na branch do #20 (ver a entrada da auditoria).

## 2026-11-04 — Integração do log de auditoria com o main

**Tipo:** manutenção · **Grupo:** financeiro · **PR:** #20 (branch `feature/financeiro-logs-auditoria`)

**O que mudou:** o `main` foi mergeado na branch de auditoria. No conflito em `Financeiro.tsx` ficaram o `colSpan` com a coluna de histórico e a mensagem vazia por aba do filtro por tipo (#17). A migration foi renomeada de `20261028200000_auditoria_financeiro` para `20261104120000_auditoria_financeiro`, para ficar depois das migrations da gestão (`20261103...`). Os perfis financeiros foram adicionados aos mapas `Record<Perfil, string>` da gestão, que deixaram de compilar.

**Por quê:** a branch estava 28 commits atrás do `main`, com conflito e com uma migration fora de ordem.

Depois do merge do #21, um segundo merge do `main` juntou o isolamento por organização com a auditoria em transação: `buscarPorId` recebe `organizacaoId` e o client da transação, e a conferência de conta/projeto do corpo roda dentro da mesma transação. Os testes de auditoria passaram a simular `findFirst` e a conta da organização do usuário.

**Pendências:** revisão de alguém da gestão (o PR mexe em `schema.prisma`). Antes de aplicar a migration, conferir `SELECT count(*) FROM public.auditoria;`: as colunas novas `modulo` e `resumo` são obrigatórias e não têm valor padrão, então a migration falha se a tabela tiver registros.

## 2026-11-04 — Resumo semanal de entradas e saídas (US-10)

**Tipo:** evolução · **Grupo:** financeiro · **PR:** #19 (branch `feature/financeiro-grafico-semanal`)

**O que mudou:** novo endpoint `GET /api/lancamentos/resumo-semanal?mes=AAAA-MM`, que agrupa o mês em semanas de 7 dias contadas a partir do dia 1.

**Por quê:** planejamento da Sprint 3, item "filtrar entradas e saídas por semana".

**Pendências:** o frontend ainda não chama o endpoint (os gráficos agrupam por semana no próprio navegador). O filtro por organização entrou na correção de isolamento acima.

## 2026-11-04 — Limpeza das branches e do ambiente local

**Tipo:** manutenção · **Grupo:** ambos

**O que mudou:** inventário das 13 branches remotas. 9 já estavam mergeadas no `main`. Outras 2 (`feature/gestao-frontend` e `feature/financeiro-frontend-separacao-telas-login`) foram superadas pela unificação do frontend: o conteúdo da primeira já está no `main`, e a segunda compartilhava o login entre dois frontends que não existem mais. Essas 11 foram marcadas para exclusão, e as 2 não mergeadas ficam guardadas nas tags `arquivo/...`. Também foram removidas as pastas de cache `frontend/SistemaFinanceiro/.runtime-*`.

**Por quê:** o número de branches abertas escondia o que de fato faltava integrar. O `node_modules` desatualizado (sem `@nestjs/swagger` no backend e sem `react-router-dom` no frontend) fazia os testes falharem localmente sem haver erro no código. Depois de `npm ci` no backend e `pnpm install --frozen-lockfile` no frontend, os testes passaram.

**Pendências:** apagar as branches remotas (precisa ser feito por alguém com permissão no repositório). Combinar no grupo: **apagar a branch logo depois do merge do PR**, para não acumular de novo.
