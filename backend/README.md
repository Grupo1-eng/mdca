# Backend

Backend em NestJS com Prisma, PostgreSQL no Neon e migrations versionadas.

## Comandos

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
npm test
```

`DATABASE_URL` e `JWT_SECRET` são obrigatórios: sem `JWT_SECRET` a aplicação
não inicia.

## Autenticação

Toda rota exige `Authorization: Bearer <accessToken>`, exceto as marcadas com
`@Publico()` (hoje, só o login).

| Método | Rota              | Descrição                                              |
|--------|-------------------|--------------------------------------------------------|
| `POST` | `/api/auth/login` | `{ email, senha }` → `{ accessToken, usuario }`. Máx. 5 tentativas por minuto por IP (429 depois disso). |
| `GET`  | `/api/auth/me`    | Dados do usuário do token: `{ id, nome, email, perfil }`. |

Não há cadastro público: usuários são criados pela coordenação em
`/api/usuarios` (tela **Usuários** do front), sempre na organização de quem
está logado. A coordenação não pode inativar a própria conta nem mudar o
próprio perfil, para não ficar sem ninguém que gerencie usuários.

O token é revalidado contra o banco a cada requisição, então um usuário
inativado perde o acesso imediatamente, mesmo com um token ainda não expirado.

Para restringir uma rota a perfis específicos:

```ts
@UseGuards(PerfisGuard)
@Perfis(PERFIS.COORDENACAO)
```


## Acesso ao módulo financeiro

O módulo financeiro guarda dados sensíveis da organização. Por isso, **só
usuários com perfil financeiro ou administrativo podem acessá-lo**. Quem não
tem um desses perfis não consegue ver nem alterar nada do financeiro, mesmo
estando logado.

### O que foi feito

- Criados 3 perfis de usuário: coordenador financeiro, gestor financeiro e
  analista financeiro.
- Todas as rotas do módulo financeiro passaram a exigir um desses 3 perfis.
- O perfil `administrativo` também passou a acessar o financeiro.
- Criado um teste automático que confirma a regra
  (`src/modules/financeiro/financeiro-acesso.integration.spec.ts`).

### Quem pode acessar

| Perfil                   | Acessa o financeiro? |
|--------------------------|----------------------|
| `coordenador`            | Sim (admin dos dois módulos) |
| `coordenador_financeiro` | Sim                  |
| `gestor_financeiro`      | Sim                  |
| `analista_financeiro`    | Sim                  |
| `administrativo`         | Sim                  |
| Qualquer outro perfil    | Não                  |

Os outros perfis são: `tecnico_servico_social`, `tecnico_psicologia` e
`educador`. A coordenação (`coordenador`) passou a acessar o financeiro em
05/11/2026: ela é admin dos dois módulos e é quem cria os usuários (ver
`docs/decisoes.md`).

### Rotas protegidas

- `/api/lancamentos`
- `/api/contas-financeiras`
- `/api/categorias-financeiras`
- `/api/contatos`
- `/api/fontes-de-recurso`
- `/api/orcamentos`

Isso vale para todas as operações dessas rotas (listar, buscar, criar,
atualizar e excluir).

`/api/projetos` é compartilhada com a gestão: qualquer usuário logado consulta,
mas criar, editar e excluir exige um perfil com acesso ao financeiro. Em
`/api/organizacoes`, todos consultam e só a coordenação altera. O log de
auditoria (`/api/auditorias`) é restrito à coordenação e à gestão financeira.

### O que o sistema responde

| Situação                                  | Resposta        |
|-------------------------------------------|-----------------|
| Sem token (não logado)                    | `401`           |
| Logado, mas com perfil sem acesso         | `403 Forbidden` |
| Logado com perfil com acesso              | Acesso normal   |

### Como dar acesso a um usuário

Ao cadastrar ou editar um usuário em `/api/usuarios`, informe no campo `perfil`
um dos perfis com acesso (`coordenador`, os 3 financeiros ou `administrativo`). Como no
restante do sistema, só a coordenação cadastra usuários.

### Onde está no código

- Lista de quem acessa o financeiro: `PERFIS_FINANCEIRO` em
  `src/modules/auth/perfis.constants.ts`. `PERFIS_EXCLUSIVOS_FINANCEIRO` são
  os 3 perfis que só existem no financeiro; o `PerfisGuard` usa essa lista para
  decidir se um acesso negado entra no log do financeiro.
- Regra aplicada no topo de cada controller do financeiro, com
  `@UseGuards(JwtAuthGuard, PerfisGuard)` e `@Perfis(...PERFIS_FINANCEIRO)`.

Para mudar quem acessa o financeiro, basta alterar a lista `PERFIS_FINANCEIRO`.

### Como testar

```bash
npm test
```

O teste `financeiro-acesso.integration.spec.ts` confere que os 3 perfis
financeiros e o `administrativo` entram, que os demais perfis recebem 403 em
todas as rotas financeiras e que quem não tem permissão não consegue gravar lançamento.

## Resumo semanal de entradas e saídas

`GET /api/lancamentos/resumo-semanal?mes=AAAA-MM` (ex.: `?mes=2026-11`)

Devolve as entradas, saídas e saldo de cada semana do mês, mais os totais do mês.
Tem o mesmo acesso do módulo financeiro (401 sem token, 403 sem perfil) e devolve
400 se o `mes` faltar ou estiver fora do formato.

- Semana = bloco de 7 dias a partir do dia 1 (1-7, 8-14, 15-21, 22-28 e 29 até o fim do mês).
- Semanas sem lançamento vêm zeradas.
- A data do lançamento é a de competência, senão a de pagamento, senão a de criação.
- Os valores vêm como texto com 2 casas decimais.

### O que foi adicionado

- Rota em `lancamentos.controller.ts` e consulta ao banco em `lancamentos.service.ts`.
- Regra das semanas em `resumo-semanal.ts` e validação do `mes` em `dto/resumo-semanal-query.dto.ts`.
- Testes: `resumo-semanal.spec.ts` e `resumo-semanal.integration.spec.ts`.

## Exportar extrato financeiro em Excel

`GET /api/lancamentos/extrato/exportar` devolve um arquivo `.xlsx` com o extrato, gerado direto do banco.
Tem o mesmo acesso do módulo financeiro (401 sem token, 403 sem perfil) e só traz lançamentos da organização do usuário.

Os filtros são opcionais e combinam entre si. Sem filtros, exporta todos os lançamentos.

| Filtro        | Formato                       | Exemplo      |
|---------------|-------------------------------|--------------|
| `de`          | `AAAA-MM-DD` (primeiro dia)   | `2026-11-01` |
| `ate`         | `AAAA-MM-DD` (último dia)     | `2026-11-30` |
| `projetoId`   | id do projeto ou `nenhum`     | `12`         |
| `categoriaId` | id da categoria (inclui subcategorias) | `3` |
| `tipo`        | `entrada` ou `saida`          | `saida`      |
| `busca`       | texto na descrição ou no projeto | `oficina` |

- A planilha traz título, filtros aplicados, data, hora e usuário da emissão, uma linha por lançamento (Data, Descrição, Projeto, Conta, Categoria, Situação, Entrada, Saída) e a linha de totais.
- A data do lançamento é a de competência, senão a de pagamento, senão a de criação, e as linhas saem ordenadas por ela.
- Filtro com formato inválido responde `400`, e projeto ou categoria que não existem (ou de outra organização) respondem `404`.

### O que foi adicionado

- Rota em `lancamentos.controller.ts` e consulta ao banco em `lancamentos.service.ts`.
- Montagem das linhas e dos totais em `extrato.ts`, geração do arquivo em `extrato-xlsx.ts` e validação dos filtros em `dto/extrato-query.dto.ts`.
- Nova dependência `exceljs` no backend.
- Testes: `extrato.spec.ts` e `extrato.integration.spec.ts`.
