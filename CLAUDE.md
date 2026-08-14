# INSTRUÇÕES PARA CLAUDE - LUMINA HOST

Este documento contém instruções para o Claude Code iniciar e gerenciar a aplicação Lumina Host.

## VISÃO GERAL DO PROJETO

**Lumina Host** é um sistema de gestão para hospitalidade (hotéis e restaurantes). O projeto inclui:

- PDV (Ponto de Venda) para restaurantes
- Gestão de reservas e quartos para hotéis
- Controle de estoque
- Demonstrativos financeiros (DRE)
- Dashboard com métricas em tempo real

## STACK TECNOLÓGICA

- **Frontend:** React 18 + TypeScript + Vite, servido por nginx em produção
- **UI:** shadcn/ui + Tailwind CSS
- **State:** TanStack Query (React Query)
- **Backend:** Node.js + Express + Prisma (API REST própria, JWT)
- **Banco de dados:** PostgreSQL (Docker local em dev, serviço próprio no EasyPanel em produção)
- **Gráficos:** Recharts
- **Animações:** Framer Motion
- **Deploy:** Docker + EasyPanel (VPS Hostinger) — ver `.docs/DEPLOY-EASYPANEL.md`

## ESTRUTURA DO PROJETO

```
lumina-host/
├── frontend/                 # App React (Vite)
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis (dashboard/, layout/, ui/)
│   │   ├── contexts/         # AuthContext, OrganizationContext
│   │   ├── hooks/            # Custom hooks (useCheckout, useDashboardData...)
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── services/         # Cliente axios + services por domínio (fala com o backend)
│   │   └── lib/              # Utilitários
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile            # Build Vite + nginx (produção)
│   └── nginx.conf
├── backend/                  # API Express + Prisma
│   ├── src/
│   │   ├── routes/           # Um arquivo de rotas por domínio
│   │   ├── controllers/      # Lógica de cada rota
│   │   └── middleware/       # auth (JWT), rbac (papéis), orgFilter (multi-tenant)
│   ├── prisma/
│   │   └── schema.prisma     # Modelo de dados (Postgres)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml         # Sobe só o Postgres local (dev)
└── .docs/DEPLOY-EASYPANEL.md  # Guia completo de deploy em produção
```

## COMO INICIAR A APLICAÇÃO (DESENVOLVIMENTO LOCAL)

### Pré-requisitos
- Node.js 18+
- Docker (para o Postgres local)

### Passo 1: Subir o banco de dados

```bash
cd "C:\Users\DAVI LOPES\Documents\Projetos Code\lumina-host"
docker compose up -d
```

Confirma que subiu: `docker compose ps` (serviço `lumina-postgres` deve estar `healthy`).

### Passo 2: Backend

```bash
cd backend
npm install          # só na primeira vez / quando mudarem dependências
npm run db:push       # aplica o schema.prisma no Postgres
npm run dev            # sobe em http://localhost:3003
```

Se `backend/.env` não existir, copie de `backend/.env.example` (as portas e credenciais já batem com o `docker-compose.yml`).

### Passo 3: Frontend (em outro terminal)

```bash
cd frontend
npm install          # só na primeira vez
npm run dev            # sobe em http://localhost:8080
```

Se `frontend/.env` não existir, copie de `frontend/.env.example`.

### Passo 4: Verificar se está tudo rodando

```bash
curl http://localhost:3003/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
```

Respostas esperadas: JSON com `"database":"connected"` no backend, `200` no frontend.

## URLS DA APLICAÇÃO (DEV LOCAL)

| Página | URL |
|--------|-----|
| Login | http://localhost:8080/ |
| Dashboard | http://localhost:8080/dashboard |
| PDV Restaurante | http://localhost:8080/pos-restaurante |
| PDV Hotel | http://localhost:8080/pos-hotel |
| Estoque | http://localhost:8080/estoque |
| Financeiro | http://localhost:8080/financeiro |
| Equipe | http://localhost:8080/equipe |
| Configurações | http://localhost:8080/configuracoes |
| API (backend) | http://localhost:3003/api |

## COMANDOS DISPONÍVEIS

### Frontend (`cd frontend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 8080) |
| `npm run build` | Build de produção (gera `dist/`) |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Verifica erros de código |

### Backend (`cd backend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com watch (porta 3003) |
| `npm run db:push` | Aplica `schema.prisma` no Postgres (sem migration) |
| `npm run db:seed` | Popula dados de teste |
| `npm run db:studio` | Abre o Prisma Studio (GUI do banco) |

## SOLUÇÃO DE PROBLEMAS

### Backend não conecta no banco

Confirme que o Postgres está rodando: `docker compose ps`. Se não estiver, `docker compose up -d`. Confira também se `backend/.env` tem o mesmo `DATABASE_URL` do `docker-compose.yml` (porta **5439**, não 5432 — evita conflito com outros projetos locais).

### Erro: "Module not found"

Reinstale as dependências na pasta certa (`frontend/` ou `backend/`):

```bash
rm -rf node_modules
npm install
```

### Tela branca ou erro no navegador

Limpe o cache do Vite:

```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Porta ocupada

**Windows:**
```bash
netstat -ano | findstr :8080
taskkill /PID <numero_do_pid> /F
```

## IMPORTANTE PARA O CLAUDE

1. Este é um monorepo com duas apps independentes: `frontend/` (Vite) e `backend/` (Express+Prisma) — cada uma com seu próprio `package.json` e `node_modules`.
2. **SEMPRE** verificar se `node_modules` existe em `frontend/` e em `backend/` antes de rodar `npm run dev` em cada um.
3. O Postgres local sobe via `docker compose up -d` na raiz do repo (porta **5439**) — não precisa instalar Postgres na máquina.
4. O backend precisa estar rodando (`http://localhost:3003`) para o frontend funcionar — não há mais Supabase.
5. Confirmar funcionamento com `curl` (ver seção "Verificar se está tudo rodando") ou abrindo no navegador.
6. Para deploy em produção, ver `.docs/DEPLOY-EASYPANEL.md` (Docker + EasyPanel numa VPS Hostinger).

## VARIÁVEIS DE AMBIENTE

- `frontend/.env` — `VITE_API_URL` (URL da API backend)
- `backend/.env` — `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`, `PORT`, `NODE_ENV`

Nenhum dos dois é commitado (`.gitignore`); copie de `.env.example` em cada pasta.

## BACKEND (EXPRESS + PRISMA)

O backend é uma API REST própria e inclui:

- **Autenticação:** JWT (access + refresh token), login/registro/logout em `/api/auth`
- **RBAC:** três papéis (`super_admin`, `admin`, `staff`), aplicado via middleware (`backend/src/middleware/rbac.ts`)
- **Multi-tenant:** cada request é filtrada pela organização do usuário (ou pelo header `X-Organization-Id` para super admins), via `backend/src/middleware/orgFilter.ts`
- **Banco de dados:** PostgreSQL via Prisma ORM

O modelo de dados completo está em `backend/prisma/schema.prisma`.

## FLUXO DE USO

1. Usuário acessa a aplicação (frontend)
2. Faz login — o frontend chama `POST /api/auth/login` no backend
3. É redirecionado para o Dashboard
4. Navega pelas funcionalidades via Sidebar
5. Toda leitura/escrita de dados passa pela API do backend (`src/services/*.service.ts`), que fala com o Postgres via Prisma

---

**Lumina Host - Sistema de Gestão para Hospitalidade**
