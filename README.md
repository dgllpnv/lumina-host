# Lumina Host

Sistema de gestão para hospitalidade (restaurantes e pousadas/hotéis): PDV,
reservas e quartos, controle de estoque, financeiro e dashboard em tempo real.

## Stack

- **Frontend** (`frontend/`): React + TypeScript + Vite, shadcn/ui, Tailwind CSS, TanStack Query
- **Backend** (`backend/`): Node.js + Express + Prisma, JWT, RBAC, multi-tenant
- **Banco de dados**: PostgreSQL
- **Deploy**: Docker + EasyPanel (VPS Hostinger)

## Rodando localmente

```sh
# 1. Sobe o Postgres local
docker compose up -d

# 2. Backend
cd backend
npm install
npm run db:push
npm run dev          # http://localhost:3003

# 3. Frontend (em outro terminal)
cd frontend
npm install
npm run dev          # http://localhost:8080
```

Copie `backend/.env.example` → `backend/.env` e `frontend/.env.example` →
`frontend/.env` antes do primeiro `npm run dev` em cada pasta.

Instruções detalhadas de desenvolvimento: ver `CLAUDE.md`.
Guia completo de deploy em produção: ver `.docs/DEPLOY-EASYPANEL.md`.

## Estrutura

```
lumina-host/
├── frontend/    # App React (Vite)
├── backend/     # API Express + Prisma
└── docker-compose.yml   # Postgres local de desenvolvimento
```
