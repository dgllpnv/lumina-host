# LUMINA HOST - Contexto para Continuacao do Desenvolvimento

> **Ultima atualizacao:** 14/08/2026
> **Assistente:** Claude

---

## 1. VISAO GERAL DO PROJETO

**Lumina Host** e um **SaaS multi-tenant** para gestao de **restaurantes** e **hoteis/pousadas**. O sistema oferece:

- **POS (Ponto de Venda)** para restaurantes e hoteis
- **Dashboard administrativo** com KPIs em tempo real
- **Gestao financeira** completa
- **Controle de estoque**
- **Gestao de equipe** com criacao direta de usuarios
- **Integracao PMS + POS** (hotel pode cobrar consumo do restaurante no checkout)

### Usuarios e Papeis (RBAC)
| Role | Acesso |
|------|--------|
| `super_admin` | Tudo + gestao de organizacoes |
| `admin` | Dashboard, Financeiro, Estoque, Equipe, Configuracoes, POS |
| `staff` | Apenas POS (restaurante ou hotel) |

---

## 2. MIGRACAO SUPABASE -> BACKEND PROPRIO (14/08/2026)

O projeto **nao usa mais Supabase**. Toda a stack de dados (auth, banco, RLS) foi
substituida por um backend Express + Prisma proprio, rodando contra PostgreSQL.
Motivo: padronizar o projeto no mesmo formato usado em outros deploys (frontend/
+ backend/ separados, Docker + EasyPanel na Hostinger, Postgres proprio) em vez
de depender de um provedor externo.

O que mudou:
- Removida a pasta `src/integrations/supabase/` e a dependencia `@supabase/supabase-js`.
- Removida a pasta `supabase/` (migrations SQL legadas) e os scripts soltos
  `seed-hospedes.js`, `setup-pms-integration.js`, `setup-rbac.js`, `test-auth.js`
  (todos falavam direto com o Supabase).
- Repositorio reestruturado em `frontend/` (o que era `src/`, `index.html`, etc.
  na raiz) e `backend/` (ja existia, Express + Prisma).
- Todas as paginas que ainda chamavam `supabase.from(...)` direto (Financeiro,
  Estoque, Equipe, Configuracoes, AdminOrganizations, SuperAdminOrganizationSelect,
  POSHotel, useCheckout) foram migradas para os services em `frontend/src/services/`
  (axios contra a API do backend).
- Credenciais antigas de Supabase que estavam neste arquivo foram removidas —
  se algum dado antigo precisar ser recuperado, ele so existe no projeto Supabase
  original (fora deste repositorio) ou no historico do git anterior a esta migracao.

Detalhes completos de arquitetura, comandos e troubleshooting: ver `CLAUDE.md`.
Guia de deploy em producao: ver `.docs/DEPLOY-EASYPANEL.md`.

---

## 3. STACK TECNOLOGICA ATUAL

```
Frontend (frontend/):
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Framer Motion (animacoes)
- Recharts (graficos)
- React Router DOM v6
- TanStack Query (cache)
- axios (cliente HTTP -> backend)

Backend (backend/):
- Node.js + Express + Prisma
- PostgreSQL
- JWT (access + refresh token)
- RBAC via middleware (super_admin / admin / staff)
- Multi-tenant via middleware de filtro por organizacao

Deploy:
- Docker (Dockerfile em frontend/ e backend/)
- docker-compose.yml na raiz sobe o Postgres local de dev
- Producao: EasyPanel numa VPS Hostinger

Design System:
- "Boutique Charm" - Slate/Indigo/Amber
- Rounded corners (2xl), shadows soft/elevated
- Animacoes sutis com Framer Motion
```

---

## 4. MODELO DE DADOS

Fonte da verdade: `backend/prisma/schema.prisma`. Tabelas principais (mesmos
nomes de campo em snake_case no banco, camelCase no Prisma/TypeScript):

- **organizations** — id, nome, tipo (restaurante | pousada), plano, ativo
- **profiles** — id, email, passwordHash, nome, avatarUrl, role, organizationId
- **user_roles** — id, userId, role
- **refresh_tokens** — id, token, userId, expiresAt
- **financial_transactions** — id, organizationId, tipo (receita|despesa), categoria, valor, status, metodoPagto, dataVencimento, dataPagamento, reservationId
- **inventory_items** — id, organizationId, nome, quantidade, unidade, categoria, estoqueMinimo, precoUnitario
- **tables_rooms** — id, organizationId, nome, tipo (mesa|quarto), status, capacidade, andar, descricao, precoBase
- **reservations** — id, organizationId, roomId, roomNumber, roomType, guestName, guestEmail, guestPhone, checkinDate, checkoutDate, status, dailyRate, totalStay

Enums (`app_role`, `organization_type`, `reservation_status`, `table_room_status`,
`transaction_status`, `transaction_type`) sao validados em codigo (campos `String`
no Prisma), nao como enum nativo do Postgres — ver comentario no topo do schema.

---

## 5. FEATURES IMPLEMENTADAS

- Autenticacao JWT com roles (super_admin, admin, staff) e rotas protegidas
- Contexto de organizacao (multi-tenant, super admin pode trocar de organizacao)
- KDS Lite, transferencia de mesa, divisao de conta, carrinho por mesa (PDV restaurante)
- Governanca hotel (mapa de quartos, limpeza)
- Integracao hotel-restaurante: cobrar consumo do restaurante na conta do quarto (via `reservationId` nas transacoes financeiras)
- Dashboard com KPIs reais, Estoque com CRUD completo, Equipe com criacao direta de usuarios, Financeiro com exportacao CSV, Configuracoes de mesas/quartos

---

## 6. BUGS CONHECIDOS / PENDENCIAS

1. **Carrinhos do POS nao persistem**: se recarregar a pagina, carrinhos das mesas sao perdidos (estado local, nao vai pro backend).
2. **Sem seed de dados de demonstracao pos-migracao**: banco comeca vazio — use `/setup` para criar o primeiro super admin, depois cadastre organizacao, mesas/quartos e itens de estoque manualmente (ou rode `npm run db:seed` em `backend/`, se o seed script existir e estiver atualizado).

---

## 7. PROXIMOS PASSOS SUGERIDOS

### Melhorias de UX
- [ ] Notificacoes em tempo real
- [ ] Dark mode toggle
- [ ] PWA para uso offline

### Novas Features
- [ ] Relatorios avancados (DRE, fluxo de caixa)
- [ ] Integracao com impressora termica
- [ ] Cardapio digital com QR Code
- [ ] Sistema de fidelidade

### Infraestrutura
- [ ] Testes automatizados (Vitest)
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento de erros (Sentry)
- [ ] Persistir frigobar/carrinho do PDV no backend (hoje e so estado local)

---

## 8. PADROES DE CODIGO

### Toda chamada de dados passa pelos services (nunca chamar a API direto com axios cru):
```typescript
import { transactionsService } from "@/services";

const { data } = await transactionsService.list({ status: "pendente" });
await transactionsService.create({ tipo: "receita", categoria: "vendas", valor: 100 });
```

O filtro por organizacao **nao** precisa ser feito manualmente no frontend — o
backend aplica isso automaticamente (`orgFilterMiddleware`, usando o token JWT
ou o header `X-Organization-Id` para super admins). Nao adicione `organizationId`
nos payloads de create/update; o backend ignora/sobrescreve com o valor correto.

### Criar usuario (admin/staff) direto:
```typescript
import { authService } from "@/services";

await authService.adminCreateUser({
  email: "email@exemplo.com",
  password: "senha123",
  nome: "Nome Completo",
  role: "staff", // ou "admin"
  organizationId: profile.organization_id,
});
```

### Usar organizacao ativa no componente:
```typescript
import { useOrganization } from "@/contexts/OrganizationContext";

function MeuComponente() {
  const { activeOrganization } = useOrganization();
  // activeOrganization.nome, activeOrganization.id, etc
}
```

---

> **Nota para o Claude**: nao ha mais Supabase neste projeto — nao sugerir
> `supabase.from(...)` nem reintroduzir a dependencia. Toda persistencia passa
> pelo backend Express (`backend/`) via os services em `frontend/src/services/`.
> Evite emojis no codigo.
