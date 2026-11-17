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

## 2026-11-05 — Saldo atual das contas mantido pelos lançamentos

**Contexto:** a conta financeira guarda `saldo_atual`, mas nada o atualizava depois do cadastro: o painel mostrava um saldo que não acompanhava os pagamentos e recebimentos (US02, RF25 e RF64). A auditoria já trata uma alteração direta do saldo como ajuste manual (`ajustar_saldo`). Ver o [registro de evolução](registro-de-evolucao.md).

**Decisão:** o `saldo_atual` é ajustado de forma **incremental**, na mesma transação que cria, edita ou exclui o lançamento. Só lançamentos realizados contam: entrada `recebido` soma, saída `pago` subtrai, `pendente` não mexe. O saldo não é recalculado do zero a cada leitura, para não apagar os ajustes manuais. Toda mudança nova que mexa em valor, tipo, situação ou conta de um lançamento precisa passar por `efeitoNoSaldo`/`ajustarSaldo` (`backend/src/modules/financeiro/lancamentos/saldo-conta.ts`).

**Consequência:** gravar um lançamento e ajustar o saldo é atômico: se um falhar, nada é gravado (RNF24). O ajuste de saldo feito pelo lançamento não gera registro de auditoria próprio, porque a auditoria do lançamento já registra o que mudou. Escrever direto em `lancamento` pelo banco, fora do service, deixa o saldo desalinhado.

## 2026-11-05 — Coordenação é admin dos dois módulos

**Contexto:** o PR #12 restringiu o financeiro aos perfis financeiros e ao administrativo, e o PR #16 passou a redirecionar para a gestão quem não tinha acesso. A coordenação (`coordenador`) ficou sem o financeiro e sem a tela de Usuários, que só existe nele, mesmo sendo o perfil que cria os usuários do sistema. O RNF01 do documento de requisitos também cita a coordenação entre quem pode editar e aprovar lançamentos. Ver o [registro de evolução](registro-de-evolucao.md).

**Decisão:** o perfil `coordenador` é o administrador dos dois módulos. Ele acessa tudo o que os perfis financeiros acessam, inclusive o log de auditoria do financeiro (`PERFIS_FINANCEIRO` e `PERFIS_AUDITORIA_FINANCEIRO`), além da gestão. As regras de acesso do frontend (`src/lib/moduloDestino.ts` e `src/lib/auditoria.ts`) espelham as do backend e mudam junto com elas.

**Consequência:** logins da coordenação e alterações em usuários coordenadores passam a entrar no log do financeiro, porque mudam quem acessa o financeiro. Para saber se uma rota é "do financeiro", não basta olhar se todos os perfis exigidos acessam o financeiro: é preciso que ao menos um seja exclusivo dele (`PERFIS_EXCLUSIVOS_FINANCEIRO`).

## 2026-11-05 — Situação do lançamento depende do tipo

**Contexto:** o formulário e a API aceitavam saída "recebido" e entrada "pago". O saldo da conta (que conta qualquer situação diferente de pendente) e os gráficos e a execução orçamentária (que olham recebido para entrada e pago para saída) mostravam números diferentes para o mesmo lançamento. Ver o [registro de evolução](registro-de-evolucao.md).

**Decisão:** entrada só tem as situações `pendente` e `recebido`; saída só `pendente` e `pago`. A regra fica em `backend/src/modules/financeiro/lancamentos/regras-lancamento.ts`, e o frontend espelha em `situacoesDoTipo` (`src/lib/rotulos.ts`).

**Consequência:** criar ou editar com combinação inválida responde 400. Uma situação nova (ex.: `cancelado`, do RF35) precisa entrar nas duas listas e ser tratada no saldo (`saldo-conta.ts`) e nos gráficos.

## 2026-11-17 — Projetos, serviços e programas são cadastrados só pela Gestão

**Contexto:** havia dois caminhos para gravar na tabela compartilhada `projeto`: a tela Projetos do Financeiro (`POST/PUT/DELETE /api/projetos`) e o cadastro da Gestão (`POST/PUT /api/iniciativas`, PR #30). Os grupos combinaram que só a Gestão cadastra, e o Financeiro deu aval para a Gestão fazer a mudança no lado dele. Ver o [registro de evolução](registro-de-evolucao.md).

**Decisão:** `/api/projetos` é só de consulta (`GET`), para todos os perfis logados. Criar e editar ficam em `/api/iniciativas`, só para a coordenação (`PERFIS_CADASTRO_INICIATIVA`). Não há exclusão de projeto pela API.

**Consequência:** a tela Projetos do Financeiro não tem mais o botão "+ Novo Projeto"; o orçamento total do projeto só é editado pela Gestão. Para apagar um projeto criado por engano é preciso acesso direto ao banco.

## 2026-11-17 — Atividades, encontros e chamada: quem grava e quando

**Contexto:** a integração de atividades, encontros e frequência com o banco (RF17, RF18, RF19) exigia três decisões do grupo da Gestão. Ver o [plano](gestao/plano-atividades-frequencia.md) e o [registro de evolução](registro-de-evolucao.md).

**Decisão:**
- Coordenação e educador gravam atividades, encontros e chamada em **qualquer** atividade da organização; os demais perfis da Gestão só consultam (`PERFIS_REGISTRO_ATIVIDADES`).
- Atividade encerrada **não aceita encontros novos**, mas pode voltar para ativa.
- **Em aberto:** quando a chamada pode ser registrada. Até a decisão, vale a opção recomendada: em qualquer encontro não cancelado, sem mudar a situação dele. A regra fica só em `aceitaChamada` (backend `gestao/atividades/regras-atividades.ts` e frontend `gestao/atividades/model.ts`).

**Consequência:** a chamada só inclui educandos ativos vinculados à iniciativa da atividade (e quem já tem presença gravada no encontro). Encontro cancelado não conta como realizado (RN05) e não recebe chamada. Regravar a chamada atualiza a presença (RN06).
