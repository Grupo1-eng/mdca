# MDCA

Sistema de gestão do MDCA, desenvolvido pelos grupos financeiro e gestão em um repositório compartilhado, com backend único em NestJS, banco PostgreSQL (Neon) e frontend React. Veja `docs/README.md` para a documentação detalhada e `AGENTS.md` para orientação a agentes de código.

## Comandos

### Frontend (`frontend/SistemaFinanceiro/`) — disponível

Requer Node 22 e pnpm 10 (ver `.mise.toml`).

```bash
cd frontend/SistemaFinanceiro
pnpm install
pnpm dev       # servidor de desenvolvimento
pnpm build     # build de produção
pnpm preview   # preview do build
pnpm format    # formata com oxfmt
```

### Backend (`backend/`) — planejado, ainda não implementado

O backend NestJS + Prisma ainda não foi criado neste repositório (ver `backend/README.md`). Quando a base for iniciada, os comandos esperados são:

```bash
cd backend
npm install                        # dependências do NestJS
npm install prisma --save-dev
npm install @prisma/client
npx prisma init                    # cria backend/prisma/schema.prisma
npx prisma migrate dev             # aplica migrations no banco (Neon)
npx prisma generate                # gera o client a partir do schema
npm run start:dev                  # servidor NestJS em desenvolvimento
```

O `DATABASE_URL` (Neon) e as demais variáveis vêm de `backend/.env.example`.
