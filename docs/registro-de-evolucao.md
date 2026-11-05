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

## 2026-11-05 — Relatórios com período, filtros e exportação em planilha

**Tipo:** evolução · **Grupo:** financeiro · **PR:** #24 (branch `feature/financeiro-relatorios-periodo-exportacao`)

**O que mudou:**
- **Extrato Financeiro:** filtros de **período** (o mesmo do painel e da tela Financeiro), **projeto** e **categoria** (a categoria principal inclui as subcategorias), além do tipo e da busca que já existiam. Uma tabela de **totais por categoria** fica abaixo do extrato.
- **Fluxo de Caixa:** deixa de ser fixo nos últimos 6 meses e segue o período escolhido, com realizado vs. previsto por semana, mês ou ano e uma tabela com os valores e o total.
- **Exportação `.xlsx`** no Extrato, no Fluxo de Caixa e na Execução Orçamentária. Os botões existiam mas não faziam nada. A planilha abre com título, filtros aplicados, data/hora e quem emitiu, e traz os valores como número com formato de dinheiro.
- Nova dependência `write-excel-file` (só escreve .xlsx, licença MIT), carregada apenas ao exportar. Montagem das linhas em `src/lib/planilha.ts`, filtros e totais em `src/lib/relatorios.ts`.
- Removido o `serieFluxoCaixa` (fixo em 6 meses), substituído pelo `serieFluxoCaixaPeriodo`.

**Por quê:** RF07 (relatórios por projeto, período e categoria), RF29 (fluxo realizado vs. previsto no período selecionado) e RF56 (relatório de fluxo de caixa exportável em planilha). Também atende parte do RF55, RF58 e RF59.

**Pendências:** exportação em PDF (RF60) e o balancete por fonte de recursos (RF57), que depende de vincular lançamentos a uma fonte no banco.

---

## 2026-11-05 — Gráfico semanal do mês selecionado na tela Financeiro

**Tipo:** evolução · **Grupo:** financeiro · **PR:** #23 (branch `feature/financeiro-grafico-semanal-mes`)

**O que mudou:** a aba "Fluxo de Caixa" da tela Financeiro passa a mostrar as barras de entradas e saídas **por semana do mês selecionado**, com os números do endpoint `GET /api/lancamentos/resumo-semanal` (PR #19), que até então nenhuma tela chamava. O mês abre de acordo com o período do filtro e pode ser trocado por um seletor e pelas setas. Cada semana aparece no eixo com o intervalo de dias ("01/11 – 07/11") e numa tabela com entradas, saídas, saldo e o total do mês. O gráfico busca de novo quando um lançamento é registrado. Componente em `frontend/SistemaFinanceiro/src/components/GraficoSemanal.tsx`, apoio em `src/lib/resumoSemanal.ts`.

**Por quê:** US10 / RF30. A aba agrupava pelo período do filtro, e não pelo mês selecionado, e não identificava cada semana. O agrupamento por semana/mês/ano continua no gráfico de realizado vs. previsto do painel, e os testes dele passaram para `serieFluxoCaixaPeriodo`.

**Pendências:** nenhuma.

---

## 2026-11-05 — Saldo das contas acompanha os lançamentos e painel por conta

**Tipo:** correção + evolução · **Grupo:** financeiro · **PR:** #22 (branch `feature/financeiro-saldo-contas-painel`)

**O que mudou:**
- **Backend:** o `saldoAtual` da conta financeira passa a ser ajustado na mesma transação do lançamento. Entrada recebida soma, saída paga subtrai, pendente não mexe. Editar ajusta só a diferença, trocar de conta devolve o valor à antiga e aplica na nova, excluir desfaz o efeito. Regra em `backend/src/modules/financeiro/lancamentos/saldo-conta.ts`, testes em `saldo-conta.spec.ts` e `saldo-contas.integration.spec.ts`.
- **Painel:** novo bloco "Saldo por conta", com o saldo de cada conta (ativas primeiro). O card de pendências tem as abas "Vencidas" e "Pagas", e as pagas do período nunca se misturam com as vencidas.
- **Tela Financeiro:** depois de registrar um lançamento, as contas são recarregadas sem piscar a tela (`recarregar` em `useApiResource`), e o card "Saldo das contas" já mostra o valor novo.

**Por quê:** o `saldoAtual` só era gravado no cadastro da conta e nunca mudava com os lançamentos, então o painel mostrava um saldo parado. Atende US02 (RF24, RF25, RF64) e US03 (RF27). Ver a decisão em [`decisoes.md`](decisoes.md#2026-11-05--saldo-atual-das-contas-mantido-pelos-lançamentos).

**Pendências:** contas que **já** tinham lançamentos pagos/recebidos antes desta mudança continuam com o saldo antigo. Para alinhar, alguém com acesso ao banco pode recalcular uma vez, **depois de conferir que não houve ajuste manual de saldo** (ações `ajustar_saldo` na auditoria):

```sql
UPDATE financeiro.conta_financeira c
SET saldo_atual = c.saldo_inicial + COALESCE((
  SELECT SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE -l.valor END)
  FROM financeiro.lancamento l
  WHERE l.conta_id = c.id AND l.situacao <> 'pendente'
), 0);
```

---

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
