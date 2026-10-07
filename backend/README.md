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
usuários com perfil financeiro podem acessá-lo**. Quem não tem esse perfil
não consegue ver nem alterar nada do financeiro, mesmo estando logado.

### O que foi feito

- Criados 3 perfis de usuário: coordenador financeiro, gestor financeiro e
  analista financeiro.
- Todas as rotas do módulo financeiro passaram a exigir um desses 3 perfis.
- Criado um teste automático que confirma a regra
  (`src/modules/financeiro/financeiro-acesso.integration.spec.ts`).

### Quem pode acessar

| Perfil                   | Acessa o financeiro? |
|--------------------------|----------------------|
| `coordenador_financeiro` | Sim                  |
| `gestor_financeiro`      | Sim                  |
| `analista_financeiro`    | Sim                  |
| Qualquer outro perfil    | Não                  |

Os outros perfis são: `coordenador`, `tecnico_servico_social`,
`tecnico_psicologia`, `educador` e `administrativo`.

### Rotas protegidas

- `/api/lancamentos`
- `/api/contas-financeiras`
- `/api/categorias-financeiras`
- `/api/contatos`
- `/api/fontes-de-recurso`
- `/api/orcamentos`

Isso vale para todas as operações dessas rotas (listar, buscar, criar,
atualizar e excluir).

Continuam abertas a qualquer usuário logado as rotas `/api/projetos` e
`/api/auditorias`, porque também são usadas pelo módulo de gestão.

### O que o sistema responde

| Situação                                  | Resposta        |
|-------------------------------------------|-----------------|
| Sem token (não logado)                    | `401`           |
| Logado, mas com perfil que não é financeiro | `403 Forbidden` |
| Logado com perfil financeiro              | Acesso normal   |

### Como dar acesso a um usuário

Ao cadastrar ou editar um usuário em `/api/usuarios`, informe um dos 3 perfis
financeiros no campo `perfil`. Como no restante do sistema, só a coordenação
cadastra usuários.

### Onde está no código

- Lista dos perfis financeiros: `PERFIS_FINANCEIRO` em
  `src/modules/auth/perfis.constants.ts`.
- Regra aplicada no topo de cada controller do financeiro, com
  `@UseGuards(JwtAuthGuard, PerfisGuard)` e `@Perfis(...PERFIS_FINANCEIRO)`.

Para mudar quem acessa o financeiro, basta alterar a lista `PERFIS_FINANCEIRO`.

### Como testar

```bash
npm test
```

O teste `financeiro-acesso.integration.spec.ts` confere que os 3 perfis
financeiros entram, que os demais perfis recebem 403 em todas as rotas
financeiras e que quem não tem permissão não consegue gravar lançamento.
