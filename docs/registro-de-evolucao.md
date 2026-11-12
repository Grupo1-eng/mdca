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

## 2026-11-12 — Cadastro de iniciativas na Gestão, vínculo do educando e ajustes das telas

**Tipo:** evolução · **Grupo:** gestão · **PR:** #30 (branch `ajustes-iniciais-sprint-4`)

**O que mudou:**
- **Cadastro de projetos, serviços e programas pela Gestão:** novas rotas `POST /api/iniciativas` e `PUT /api/iniciativas/:id`, só para a coordenação (`PERFIS_CADASTRO_INICIATIVA` em `backend/src/modules/gestao/perfis-gestao.ts`). Usam a tabela compartilhada `projeto` e os mesmos DTOs de `/api/projetos`, sem campo novo. Gravam na organização do usuário; projeto de outra organização responde 404. A auditoria é a mesma do projeto (recurso `projeto`), então o histórico continua aparecendo no Financeiro. `GET /api/iniciativas` passou a devolver `orcamentoTotal`, para a edição não apagar o orçamento.
- A tela `/gestao/projetos` (PR #29) passou a usar essas rotas, sem o filtro de organização feito no navegador (o backend já filtra). Depois de salvar, a lista de iniciativas da ficha do educando é recarregada.
- **Vínculo do educando com a iniciativa (RF21):** `GET /api/iniciativas` e `api/educando-projetos` (listar, criar, atualizar data de ingresso, encerrar; sem DELETE). A ficha do educando grava a iniciativa e a data de ingresso.
- **Ajustes das telas:** dashboard com dados reais (educandos e agenda), horário de atendimento e acompanhamento corrigido (diferença de 3 horas do UTC), CPF com máscara e 11 dígitos (frontend e DTOs).
- Merge da `main` (PRs #22 a #29). Nos 3 conflitos em educandos ficou a versão com o vínculo, que substitui o aviso provisório do PR #29.

**Por quê:** combinado com o Financeiro (Pedro): só a Gestão cadastra iniciativas. RF20 e RF21.

**Pendências:**
- Financeiro: tirar o botão "+ Novo Projeto" da tela Projetos e restringir ou remover `POST/PUT/DELETE /api/projetos`. Depois disso, o orçamento só é editado pela Gestão (a tela do Financeiro não tem edição).
- Revisar: `GET /api/iniciativas` entrega `orcamentoTotal` a todos os perfis da Gestão (educador, técnicos, administrativo), embora a tela só mostre o valor no formulário da coordenação. Mantido assim por ora.
- Migration de integridade da Gestão (branch `feature/gestao-integridade-banco`): o índice único em `educando_projeto(educando_id, projeto_id)` conflita com recriar vínculo encerrado; a proposta é reativar o vínculo antigo.

---

## 2026-11-05 — Regras do lançamento: situação, conta inativa e valor

**Tipo:** correção · **Grupo:** financeiro · **PR:** #28 (branch `feature/financeiro-regras-lancamento`)

**O que mudou:**
- **Situação compatível com o tipo:** entrada só pode ser "pendente" ou "recebido"; saída, "pendente" ou "pago". O backend responde 400 nas outras combinações, tanto ao criar quanto ao editar (comparando com o que já está gravado). O formulário só oferece as situações do tipo escolhido e volta para "Previsto" ao trocar o tipo. Regra em `backend/src/modules/financeiro/lancamentos/regras-lancamento.ts`.
- **Conta inativa:** não aceita lançamento novo nem receber um lançamento movido de outra conta (400). Os lançamentos que ela já tinha continuam editáveis. O formulário só lista contas ativas.
- **Valor maior que zero:** `"0"` e `"0.00"` respondem 400; o campo do formulário tem mínimo de R$ 0,01.
- Testes em `backend/src/modules/financeiro/regras-lancamento.integration.spec.ts` e `regras-lancamento.spec.ts`. Mocks de testes antigos ganharam `ativa` e `situacao`, que o banco sempre devolve.
- Antes de ativar as validações, conferi o banco compartilhado: nenhum lançamento tinha situação incompatível, valor zero ou conta inativa.

**Por quê:** itens 6, 7 e 8 da revisão abaixo (RF33, RNF10, RF16).

**Pendências:** nenhuma.

---

## 2026-11-05 — Revisão do repositório: falhas encontradas

**Tipo:** manutenção · **Grupo:** ambos · **PR:** #27 e #28

**O que mudou:** revisão de segurança, regras de negócio e processo sobre o `main` com os PRs #22 a #26. Resultado:

| # | Falha | Gravidade | Situação |
|---|---|---|---|
| 1 | `POST /api/auth/register` era público e criava conta `administrativo` (acesso ao financeiro e à lista de educandos) na organização informada no corpo. Qualquer pessoa na internet entrava no sistema. | Crítica | Corrigida no #27: endpoint removido |
| 2 | Qualquer usuário logado, até educador, criava, editava e excluía organizações. | Baixa | Corrigida no #27: só a coordenação altera |
| 3 | Qualquer perfil logado (educador, técnicos) criava, editava e **excluía projetos**. | Média | Corrigida no #27: só perfis com acesso ao financeiro alteram |
| 4 | Projetos, organizações, categorias, contatos, fontes de recurso e orçamentos não filtram por organização. | — | Não se aplica: o sistema é usado só pelo MDCA |
| 5 | Dependências do backend com vulnerabilidades altas (`body-parser`, `multer`, `@nestjs/core` ≤ 11.1.17, `deepmerge-ts`). O frontend não tem. | Alta | **Pendente:** a correção exige subir versão maior do NestJS |
| 6 | Situação incompatível com o tipo (saída "Recebida", entrada "Paga"): o saldo da conta contava, mas os gráficos e a execução orçamentária não. | Média | Corrigida no #28 |
| 7 | Conta financeira inativa aceitava lançamento novo (RNF10, RF16). | Média | Corrigida no #28 |
| 8 | Valor zero era aceito no lançamento (RF33 exige maior que zero). | Baixa | Corrigida no #28 |
| 9 | Lançamentos, contas e projetos são excluídos fisicamente; o RF36 e o RF69 pedem cancelamento ou inativação. A auditoria guarda o estado excluído. | Média | **Pendente** |
| 10 | Não há CI: os testes só rodam na máquina de quem lembra de rodar. | Média | **Pendente** |
| 11 | `npm run lint` falha (não há configuração de ESLint), e os arquivos não seguem o Prettier. | Baixa | **Pendente** |
| 12 | CORS aberto para qualquer origem (`main.ts`). Risco baixo, porque o token não vai em cookie. | Baixa | **Pendente** |

Pontos conferidos sem problema: nenhum segredo versionado; `JWT_SECRET` obrigatório; senhas com bcrypt; limite de tentativas no login; usuário inativado perde o acesso na requisição seguinte; gestão filtrando por organização.

**Por quê:** pedido de revisão geral do repositório por bugs, fraquezas e partes quebradas.

**Pendências:** itens 5, 9, 10, 11 e 12.

---

## 2026-11-05 — Cadastro público removido e perfis em projetos e organização

**Tipo:** correção (segurança) · **Grupo:** ambos · **PR:** #27 (branch `feature/financeiro-seguranca-perfis`)

**O que mudou:**
- `POST /api/auth/register` foi removido, junto com o `RegisterDto` e os testes dele. Usuários continuam sendo criados pela coordenação em `/api/usuarios`, como o `backend/README.md` já dizia ("não há cadastro público"). O endpoint tinha entrado em 06/10 (commit `530da08`) contrariando essa regra.
- `/api/projetos`: todos os logados consultam; criar, editar e excluir exige um perfil com acesso ao financeiro (`PERFIS_FINANCEIRO`).
- `/api/organizacoes`: todos os logados consultam; criar, editar e excluir só a coordenação.
- Teste em `backend/src/modules/shared/permissoes-cadastros.integration.spec.ts`.

**Por quê:** itens 1, 2 e 3 da revisão acima.

**Pendências:** nenhuma.

---

## 2026-11-05 — Tela Financeiro filtrada por projeto

**Tipo:** evolução · **Grupo:** financeiro · **PR:** #26 (branch `feature/financeiro-filtro-projeto`)

**O que mudou:** a tela Financeiro ganhou um seletor de projeto ("Todos os projetos", cada projeto ou "Sem projeto"), e tudo nela segue a escolha: a lista e as abas, os cartões e o gráfico semanal. Com um projeto escolhido, o quarto cartão deixa de ser o saldo das contas, que é da organização inteira, e mostra o orçamento executado do projeto: saídas pagas em relação ao orçamento total, em vermelho quando esgota. O endpoint `GET /api/lancamentos/resumo-semanal` aceita `projetoId` (id do projeto ou `nenhum`).

**Por quê:** a tela Financeiro repetia o painel inicial: os mesmos cartões, o mesmo período e mais um gráfico geral. Com o filtro, ela responde "como está o dinheiro do projeto X?", o que nenhuma outra tela fazia. Atende o RF39 (filtro por projeto), o RF40 (totais recalculados conforme os filtros) e o RF05/RF12 (orçado × executado do projeto).

**Pendências:** os outros filtros combinados do RF39 (conta, categoria, fonte de recurso e situação).

---

## 2026-11-05 — Coordenação volta a acessar o financeiro

**Tipo:** correção · **Grupo:** ambos · **PR:** #25 (branch `feature/financeiro-coordenador-acesso`)

**O que mudou:** o perfil `coordenador` volta a acessar o módulo financeiro, inclusive o histórico de auditoria, e continua com acesso à gestão. No login, quem escolhe "Financeiro" com esse perfil entra no financeiro, e a gestão mostra o atalho "Ir para Financeiro". No backend, `coordenador` entrou em `PERFIS_FINANCEIRO` e em `PERFIS_AUDITORIA_FINANCEIRO`. O `PerfisGuard` passou a usar a nova lista `PERFIS_EXCLUSIVOS_FINANCEIRO` para decidir se um acesso negado entra no log do financeiro, para as rotas só da coordenação (ex.: usuários) continuarem de fora.

**Por quê:** escolhendo "Financeiro" no login, a coordenação caía na gestão sem nenhum aviso. Isso veio da soma de dois PRs. O **#12** (`feature/financeiro-acesso-por-perfil`) tirou o `coordenador` das rotas do financeiro, que passaram a responder 403. O **#16** (`feature/gestao-sprint3`, commit `f0aac6b`), para não mostrar uma tela cheia de 403, passou a redirecionar esse perfil para a gestão em silêncio. Efeito colateral: a tela de **Usuários**, que só existe no financeiro e só a coordenação usa, ficou inacessível, e ninguém conseguia mais criar usuários pela interface. A coordenação é admin dos dois módulos (ver [`decisoes.md`](decisoes.md#2026-11-05--coordenação-é-admin-dos-dois-módulos)).

**Pendências:** nenhuma.

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
