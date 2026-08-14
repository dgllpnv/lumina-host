# Tutorial completo — Deploy do Lumina Host no Hostinger + EasyPanel

> Guia passo-a-passo para subir o Lumina Host (Node/Express + React/Vite + PostgreSQL) numa **VPS Hostinger** gerenciada pelo **EasyPanel**.

---

## Sumário

1. [Antes de começar](#1-antes-de-começar)
2. [Conceitos fundamentais](#2-conceitos-fundamentais)
3. [Fase 1 — DNS no Hostinger](#fase-1--configurar-o-dns-no-hostinger)
4. [Fase 2 — Gerar segredos](#fase-2--gerar-segredos)
5. [Fase 3 — Projeto no EasyPanel + Postgres](#fase-3--criar-o-projeto-no-easypanel--serviço-de-banco)
6. [Fase 4 — Serviço Backend](#fase-4--subir-o-serviço-backend)
7. [Fase 5 — Serviço Frontend](#fase-5--subir-o-serviço-frontend)
8. [Fase 6 — Migrar o schema do banco](#fase-6--migrar-o-schema-do-banco)
9. [Fase 7 — Smoke test](#fase-7--smoke-test-em-produção)
10. [Fase 8 — Hardening pós-deploy](#fase-8--hardening-pós-deploy)
11. [Apêndice A — Atualizações](#apêndice-a--como-atualizar-coisas-depois)
12. [Apêndice B — Problemas comuns](#apêndice-b--problemas-comuns-e-soluções)

---

## 1. Antes de começar

Ao final, você terá:

- Frontend acessível via `https://seudominio.com`
- API acessível via `https://api.seudominio.com`
- PostgreSQL isolado (sem exposição pública)
- HTTPS automático (Let's Encrypt)

### Pré-requisitos

| Item | Por que precisa |
|---|---|
| VPS Hostinger com EasyPanel | É onde a aplicação vai rodar |
| Domínio próprio | Endereço público do sistema |
| Repositório no GitHub | EasyPanel puxa o código de lá |
| `Dockerfile` no backend e no frontend | Já existem neste repo (`backend/Dockerfile`, `frontend/Dockerfile`) |

### Tempo estimado

Configuração ativa: 45–90 minutos. Propagação de DNS: 5min–2h (roda em paralelo).

---

## 2. Conceitos fundamentais

### 2.1 — EasyPanel

Painel web que roda na VPS e gerencia containers Docker: build de imagens a partir do GitHub, roteamento de domínios (Traefik), HTTPS automático, variáveis de ambiente, logs. Acesso em `http://<IP_VPS>:3000`.

### 2.2 — Estrutura no EasyPanel

```
EasyPanel
└── Projeto "lumina"
    ├── Serviço "lumina-postgres"  (template oficial Postgres)
    ├── Serviço "lumina-backend"   (App, build a partir de backend/Dockerfile)
    └── Serviço "lumina-frontend"  (App, build a partir de frontend/Dockerfile)
```

### 2.3 — Dois subdomínios

```
seudominio.com       → frontend (interface web)
api.seudominio.com   → backend (API JSON)
```

Domínios separados deixam o CORS explícito e facilitam debug.

### 2.4 — Build time vs Runtime

| Categoria | Quando é lida | Exemplo | Mudou? |
|---|---|---|---|
| **Build time** | Durante o build da imagem | `VITE_API_URL` (Vite congela no JS final) | Precisa **Implantar** (rebuild) |
| **Runtime** | Quando o container roda | `JWT_ACCESS_SECRET`, `DATABASE_URL` | Basta **Reiniciar** |

**Regra de bolso:** mudou variável do frontend → Implantar. Mudou variável do backend → Reiniciar.

---

## Fase 1 — Configurar o DNS no Hostinger

1. Painel Hostinger → Domínios → seu domínio → Zona DNS
2. Adicione dois registros **A**:
   - Nome `@` → IP da VPS
   - Nome `api` → IP da VPS (mesmo IP)
3. Verifique com `nslookup api.seudominio.com` até resolver para o IP correto.

---

## Fase 2 — Gerar segredos

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Rode duas vezes: um valor para `JWT_ACCESS_SECRET`, outro para `JWT_REFRESH_SECRET`. Guarde os dois.

---

## Fase 3 — Criar o projeto no EasyPanel + serviço de banco

1. Acesse `http://<IP_VPS>:3000`, crie o projeto `lumina`.
2. **+ Serviço → Postgres**:

   | Campo | Valor |
   |---|---|
   | Nome | `lumina-postgres` |
   | Versão | `16-alpine` |
   | Banco de Dados | `lumina_host` |
   | Usuário | `lumina_user` |
   | Senha | gerar forte, anotar |

3. **Não** exponha a porta publicamente. Volume persistente habilitado (padrão).
4. Anote a connection string interna: `postgresql://lumina_user:<SENHA>@lumina_lumina-postgres:5432/lumina_host` (padrão `<projeto>_<serviço>` do EasyPanel).

---

## Fase 4 — Subir o serviço Backend

1. **+ Serviço → App**, nome `lumina-backend`.
2. Aba **Fonte**: GitHub, seu repositório, branch `main`, **Caminho de Build:** `/backend`, tipo de construção **Dockerfile**.
3. Aba **Ambiente**:

   ```env
   DATABASE_URL=postgresql://lumina_user:SUA_SENHA_PG@lumina_lumina-postgres:5432/lumina_host
   JWT_ACCESS_SECRET=COLOQUE_AQUI_O_PRIMEIRO_SEGREDO
   JWT_REFRESH_SECRET=COLOQUE_AQUI_O_SEGUNDO_SEGREDO
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=production
   ALLOWED_ORIGINS=https://seudominio.com
   ```

4. Aba **Domínios**: Host `api.seudominio.com`, Path `/`, Porta `3001`, HTTPS ✓.
5. Aba **Recursos**: 1 CPU / 512 MB para começar.
6. Aba **Implantações → Implantar**. Acompanhe os logs.
7. Teste: `curl https://api.seudominio.com/health` deve retornar `{"success":true,...,"database":"connected"}`.

---

## Fase 5 — Subir o serviço Frontend

1. **+ Serviço → App**, nome `lumina-frontend`.
2. Aba **Fonte**: mesmo repo/branch, **Caminho de Build:** `/frontend`, Dockerfile.
3. Aba **Ambiente** (vira build-arg automaticamente, pois o Dockerfile declara `ARG VITE_API_URL`):

   ```env
   VITE_API_URL=https://api.seudominio.com/api
   ```

   Sem barra no final, sempre com `https://`. Toda mudança aqui exige **Implantar** (não Reiniciar).

4. Aba **Domínios**: Host `seudominio.com`, Path `/`, Porta `80`, HTTPS ✓. Opcional: `www.seudominio.com` redirecionando para o domínio raiz.
5. Aba **Recursos**: memória **1024 MB durante o build** (Vite + Tailwind consomem bastante); pode reduzir para 256 MB depois do build estabilizar.
6. **Implantar**. Build leva ~5–7 min na primeira vez.
7. Abra `https://seudominio.com` em aba anônima e teste o login.

---

## Fase 6 — Migrar o schema do banco

Deploy zerado: pule esta fase — `npm run start:prod` do backend já roda `prisma db push` automaticamente ao subir.

Se precisar aplicar mudanças de schema manualmente depois (sem apagar dados):

1. EasyPanel → `lumina-backend` → aba **Console**
2. `npx prisma db push` (sem `--force-reset`)

Para popular dados de teste (opcional, ambiente novo):

```bash
npx tsx prisma/seed.ts
```

---

## Fase 7 — Smoke test em produção

Em aba anônima, confira:

- [ ] Tela de login carrega (sem 502/503)
- [ ] HTTPS com cadeado válido nos dois domínios
- [ ] Login funciona
- [ ] Dashboard mostra dados reais
- [ ] Criar organização (super admin), item de estoque, transação financeira, mesa/quarto
- [ ] DevTools → Network: chamadas vão para `https://api.seudominio.com/api/...` com status 200
- [ ] Logs do backend sem erros 5xx recorrentes

---

## Fase 8 — Hardening pós-deploy

1. Troque a senha do primeiro super admin (criada via `/setup`) assim que possível.
2. Confirme que `backend/.env` e `frontend/.env` **não** estão commitados (`.gitignore` já cobre isso).
3. Configure backup automático do Postgres no EasyPanel (aba **Backups** do serviço `lumina-postgres`), idealmente com destino externo.
4. Monitore logs nas primeiras 24–48h.

---

## Apêndice A — Como atualizar coisas depois

- **Push de código novo:** EasyPanel não implanta sozinho — vá no serviço afetado → **Implantações → Implantar**.
- **Mudar variável do backend** (ex: `ALLOWED_ORIGINS`): edita em **Ambiente** → **Reiniciar** (não precisa rebuild).
- **Mudar `VITE_API_URL`:** edita em **Ambiente** do frontend → **Implantar** (rebuild obrigatório, Vite congela em build time).
- **Debug em produção:** aba **Console** do serviço → shell direto no container (`npx prisma studio`, `curl localhost:3001/health`, etc).

---

## Apêndice B — Problemas comuns e soluções

**API retorna HTML em vez de JSON** → domínio do backend mal configurado (Host com `https://` ou Path `//`). Recrie o domínio com Host puro, Path `/`.

**"Failed to fetch" no login** → `VITE_API_URL` não foi aplicado (precisa **Implantar**, não Reiniciar) ou está apontando para `localhost`/domínio errado.

**CORS error no console** → `ALLOWED_ORIGINS` do backend não inclui o domínio do frontend. Editar e **Reiniciar**.

**Backend não conecta no banco** → hostname errado em `DATABASE_URL`. Padrão EasyPanel: `<projeto>_<serviço>`, ex. `lumina_lumina-postgres`.

**Build do frontend trava/OOM** → aumentar memória do serviço para 1024 MB durante o build.

**Build do backend falha em `prisma generate`** → o Dockerfile já usa `npm ci --ignore-scripts` + copia `prisma/` antes de gerar o client; se você alterar o Dockerfile, mantenha essa ordem.

**Cadeado inválido / SSL** → aguarde 5–10 min após o DNS propagar para o Let's Encrypt emitir o certificado.
