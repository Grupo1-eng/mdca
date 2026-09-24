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

### Backend (`backend/`) — NestJS + Prisma

Para instalar as dependências e iniciar o backend:

```bash
cd backend
npm install                        # dependências do NestJS
npx prisma migrate dev             # aplica migrations no banco (Neon)
npx prisma generate                # gera o client a partir do schema
npm run start:dev                  # servidor NestJS em desenvolvimento
```

Configure `DATABASE_URL` (Neon) no arquivo `backend/.env`.
