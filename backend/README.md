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
