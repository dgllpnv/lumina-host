# LUMINA HOST - Contexto para Continuacao do Desenvolvimento

> **Ultima atualizacao:** 17/01/2026
> **Desenvolvedor:** Enzo
> **Assistente:** Claude (Opus 4.5)
> **GitHub:** https://github.com/dgllpnv/lumina-host

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

## 2. CREDENCIAIS SUPABASE (IMPORTANTE!)

```
Project ID: hzozuldxgqprcnlpeovt
URL: https://hzozuldxgqprcnlpeovt.supabase.co
Dashboard: https://supabase.com/dashboard/project/hzozuldxgqprcnlpeovt

Anon Key (publica - usada no frontend):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b3p1bGR4Z3FwcmNubHBlb3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc5OTcsImV4cCI6MjA4NDEwMzk5N30.KuprsDLa_fJCis0_WNf5hkhHGg-aNHil5stQs6ZevJ8

Service Role Key (secreta - para migracoes SQL):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b3p1bGR4Z3FwcmNubHBlb3Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUyNzk5NywiZXhwIjoyMDg0MTAzOTk3fQ.QE0eLa-WazGj_NjClvyyx-akaGasTrs5YQFRYTqzsKw
```

### Como executar migracoes SQL:
1. Acesse: https://supabase.com/dashboard/project/hzozuldxgqprcnlpeovt/sql
2. Cole o conteudo do arquivo `.sql`
3. Clique em "Run"

---

## 3. ESTADO ATUAL DO BANCO DE DADOS

### Tabelas que EXISTEM no Supabase:
- `organizations` ✅ (tem dados)
- `profiles` ✅ (tem dados)
- `user_roles` ✅ (tem dados)

### Tabelas que FALTAM criar:
- `financial_transactions` ❌
- `inventory_items` ❌
- `tables_rooms` ❌
- `reservations` ❌

### MIGRACAO PENDENTE:
**Execute o arquivo:** `supabase/migrations/20260117_consolidated_fix.sql`

Este arquivo cria todas as tabelas faltantes, RLS policies, funcoes e a funcao `admin_create_user` para criacao direta de usuarios.

---

## 4. COMO RODAR O PROJETO

### Requisitos:
- Node.js 18+
- npm

### Comandos:
```bash
cd C:\Users\Enzo\Downloads\lumina-host-main\lumina-host-main
npm install
npm run dev
```

### Servidor:
- **Porta:** 8080 (ou 8081 se 8080 estiver ocupada)
- **URL:** http://localhost:8080
- **Nao usa Docker** - apenas Vite dev server

### Logins disponiveis:
```
Super Admin:
Email: super@lumina.com
Senha: 123456
```

---

## 5. STACK TECNOLOGICA

```
Frontend:
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Framer Motion (animacoes)
- Recharts (graficos)
- React Router DOM v6
- TanStack Query (cache)

Backend:
- Supabase (PostgreSQL + Auth + RLS)
- Row Level Security para isolamento multi-tenant

Design System:
- "Boutique Charm" - Slate/Indigo/Amber
- Rounded corners (2xl), shadows soft/elevated
- Animacoes sutis com Framer Motion
```

---

## 6. ESTRUTURA DE PASTAS

```
src/
├── components/
│   ├── dashboard/        # KPICard, RevenueChart, ExpensesPieChart, TopProducts, RecentTransactions
│   ├── layout/           # AppLayout, AppSidebar (mostra nome da org)
│   └── ui/               # shadcn components (Button, Dialog, Input, Textarea, etc)
├── contexts/
│   ├── AuthContext.tsx   # Autenticacao + perfil do usuario
│   └── OrganizationContext.tsx  # Organizacao ativa (useOrganization hook)
├── hooks/
│   ├── useDashboardData.ts  # KPIs e dados do dashboard (saldo MENSAL)
│   ├── useCheckout.ts       # Checkout do POS
│   └── use-toast.ts
├── integrations/
│   └── supabase/
│       ├── client.ts     # Cliente Supabase (usa env vars)
│       └── types.ts      # Tipos gerados do banco (inclui novos campos)
├── pages/
│   ├── Dashboard.tsx     # Dashboard com KPIs reais
│   ├── POSRestaurante.tsx # POS completo do restaurante
│   ├── POSHotel.tsx      # POS do hotel + Governanca
│   ├── Financeiro.tsx    # Gestao financeira + CSV export (com org filter)
│   ├── Estoque.tsx       # CRUD de produtos
│   ├── Equipe.tsx        # Gestao de colaboradores (criacao direta)
│   ├── Configuracoes.tsx # Mesas e Quartos (campos avancados para quartos)
│   ├── Auth.tsx          # Login/Signup
│   └── ...
├── .env                  # Variaveis de ambiente (Supabase keys)
└── App.tsx               # Rotas e providers

supabase/
└── migrations/
    ├── 20260113012112_*.sql      # Schema base (parcialmente aplicado)
    ├── 20260113022444_*.sql      # handle_new_user update
    ├── 20260115000000_*.sql      # fix super admin setup
    ├── 20260115100000_*.sql      # fix RLS circular dependency
    ├── 20260116_pms_pos_*.sql    # reservations table
    ├── 20260117_enterprise_*.sql # enterprise upgrade (RLS completo)
    └── 20260117_consolidated_fix.sql  # *** EXECUTAR ESTE ***
```

---

## 7. ESTRUTURA DO BANCO DE DADOS

### Enums:
```sql
app_role: 'super_admin' | 'admin' | 'staff'
organization_type: 'restaurante' | 'pousada'
transaction_type: 'receita' | 'despesa'
transaction_status: 'pendente' | 'pago' | 'cancelado' | 'atrasado'
table_room_status: 'livre' | 'ocupado' | 'sujo' | 'reservado'
reservation_status: 'reservado' | 'checkin' | 'checkout' | 'cancelado'
```

### Tabelas:

**organizations**
- id, nome, tipo, plano, ativo, created_at, updated_at

**profiles**
- id (FK auth.users), organization_id (FK organizations), role, nome, avatar_url, email, created_at, updated_at

**user_roles**
- id, user_id (FK auth.users), role

**financial_transactions**
- id, organization_id, tipo, valor, categoria, descricao, metodo_pagto, status, data_vencimento, data_pagamento, reservation_id, created_at, updated_at

**inventory_items**
- id, organization_id, nome, quantidade, unidade, preco_unitario, estoque_minimo, categoria, created_at, updated_at

**tables_rooms**
- id, organization_id, nome, tipo, capacidade, status, **andar** (novo), **descricao** (novo), **preco_base** (novo), created_at, updated_at

**reservations**
- id, organization_id, room_id, room_number, room_type, guest_name, guest_email, guest_phone, guest_document, checkin_date, checkout_date, actual_checkin, actual_checkout, status, daily_rate, total_stay, notes, created_at, updated_at

### Funcoes RPC importantes:
- `get_my_organization_id()` - Retorna org do usuario atual
- `is_super_admin()` - Verifica se e super admin
- `admin_create_user(p_email, p_password, p_nome, p_role)` - Cria usuario diretamente
- `get_guest_charges(p_reservation_id)` - Extrato do hospede
- `get_guest_total(p_reservation_id)` - Total da conta do hospede

---

## 8. FEATURES IMPLEMENTADAS

### Sprint RBAC (Concluido)
- [x] Autenticacao com Supabase Auth
- [x] Roles: super_admin, admin, staff
- [x] Rotas protegidas por role
- [x] Contexto de organizacao

### Sprint Staff (Concluido)
- [x] KDS Lite: Enviar pedidos para cozinha
- [x] Transferencia de Mesa
- [x] Divisao de Conta
- [x] Carrinho por Mesa
- [x] Governanca Hotel

### Sprint PMS+POS (Concluido)
- [x] Integracao hotel-restaurante
- [x] Cobrar consumo na conta do quarto
- [x] Tabela `reservations`

### Sprint Admin (Concluido)
- [x] Dashboard Real com KPIs do Supabase
- [x] Estoque com CRUD completo
- [x] Equipe com gestao de colaboradores
- [x] Configuracoes de mesas/quartos
- [x] Financeiro com exportacao CSV

### Sprint Enterprise (CONCLUIDO HOJE - 17/01/2026)
- [x] **RLS Completo**: Policies para todas as tabelas (financial_transactions, inventory_items, tables_rooms, reservations)
- [x] **Funcao get_my_organization_id()**: Helper para RLS
- [x] **Criacao Direta de Usuarios**: Funcao `admin_create_user` via RPC
- [x] **Indicador de Organizacao no Sidebar**: Mostra "Gerenciando: [Nome]"
- [x] **Saldo Mensal no Dashboard**: Filtro por periodo mensal (nao historico total)
- [x] **Seguranca no Financeiro**: Filtro organization_id no UPDATE
- [x] **Campos Avancados para Quartos**: andar, descricao, preco_base

---

## 9. ARQUIVOS MODIFICADOS NA ULTIMA SESSAO

| Arquivo | Modificacao |
|---------|-------------|
| `supabase/migrations/20260117_consolidated_fix.sql` | CRIADO - Migracao consolidada |
| `supabase/migrations/20260117_enterprise_upgrade.sql` | CRIADO - Enterprise upgrade |
| `src/integrations/supabase/types.ts` | Novos campos tables_rooms + funcoes |
| `src/components/layout/AppSidebar.tsx` | Indicador de organizacao |
| `src/hooks/useDashboardData.ts` | Saldo mensal |
| `src/pages/Financeiro.tsx` | Filtro org no update |
| `src/pages/Equipe.tsx` | Criacao direta de usuarios |
| `src/pages/Configuracoes.tsx` | Campos avancados quartos |

---

## 10. COMO RETOMAR O DESENVOLVIMENTO

### Passo 1: Verificar se migracao foi executada
```bash
# Testar se tabelas existem via API
curl -s "https://hzozuldxgqprcnlpeovt.supabase.co/rest/v1/financial_transactions?select=id&limit=1" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"
```

Se retornar erro "table not found", execute a migracao:
1. Abra: https://supabase.com/dashboard/project/hzozuldxgqprcnlpeovt/sql
2. Cole o conteudo de `supabase/migrations/20260117_consolidated_fix.sql`
3. Execute

### Passo 2: Rodar o projeto
```bash
cd C:\Users\Enzo\Downloads\lumina-host-main\lumina-host-main
npm run dev
```

### Passo 3: Testar
1. Acesse http://localhost:8080
2. Login: super@lumina.com / 123456
3. Verifique se o Dashboard carrega KPIs
4. Teste criar colaborador em Equipe
5. Teste criar quarto com campos avancados em Configuracoes

---

## 11. PADROES DE CODIGO

### Queries Supabase - SEMPRE filtrar por org:
```typescript
// SELECT
const { data } = await supabase
  .from("tabela")
  .select("*")
  .eq("organization_id", profile.organization_id);

// UPDATE - incluir filtro de seguranca
const { error } = await supabase
  .from("tabela")
  .update({ campo: valor })
  .eq("id", item.id)
  .eq("organization_id", profile.organization_id);  // <- Importante!
```

### Criar usuario via RPC:
```typescript
const { data, error } = await supabase.rpc("admin_create_user", {
  p_email: "email@exemplo.com",
  p_password: "senha123",
  p_nome: "Nome Completo",
  p_role: "staff",  // ou "admin"
});
```

### Usar organizacao no componente:
```typescript
import { useOrganization } from "@/contexts/OrganizationContext";

function MeuComponente() {
  const { activeOrganization } = useOrganization();
  // activeOrganization.nome, activeOrganization.id, etc
}
```

---

## 12. BUGS CONHECIDOS / PENDENCIAS

1. **Carrinhos do POS nao persistem**: Se recarregar a pagina, carrinhos das mesas sao perdidos

2. **Hospedes PMS**: Depende de dados na tabela `reservations` - criar hospedes de teste se necessario

3. **Migracao Pendente**: Executar `20260117_consolidated_fix.sql` se tabelas estiverem faltando

---

## 13. PROXIMOS PASSOS SUGERIDOS

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

---

## 14. ARQUIVOS .ENV

```env
# .env (na raiz do projeto)
VITE_SUPABASE_PROJECT_ID="hzozuldxgqprcnlpeovt"
VITE_SUPABASE_URL="https://hzozuldxgqprcnlpeovt.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b3p1bGR4Z3FwcmNubHBlb3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc5OTcsImV4cCI6MjA4NDEwMzk5N30.KuprsDLa_fJCis0_WNf5hkhHGg-aNHil5stQs6ZevJ8"
```

---

> **Nota para o Claude**: Ao retomar, PRIMEIRO verifique se as tabelas existem no Supabase. Se nao, execute a migracao `20260117_consolidated_fix.sql`. O usuario (Enzo) prefere respostas diretas e codigo funcional. Sempre use organization_id para filtrar dados. Evite emojis no codigo.
