# 🚀 Manual de Deploy — Lumina Host

> **Filosofia:** a partir do primeiro deploy, este sistema atende um cliente
> real (Pousada Algas Marinhas). Toda mudança futura deve ser um **progresso**,
> **nunca um regresso** — em hipótese alguma um deploy pode apagar, corromper
> ou tirar do ar dados/funcionalidades que já estão em produção.

Este documento tem duas partes: **Parte 1** é o passo a passo para colocar o
Lumina no ar pela primeira vez, na sua VPS Hostinger com EasyPanel. **Parte 2**
é o manual de segurança para toda atualização futura — leia antes de qualquer
`git push` depois que o sistema já estiver com dados reais.

---

# PARTE 1 — Primeiro deploy

## Sumário

1. [Antes de começar](#1-antes-de-começar)
2. [Conceitos fundamentais](#2-conceitos-fundamentais)
3. [Checklist pré-deploy específico do Lumina](#3-checklist-pré-deploy-específico-do-lumina)
4. [Fase 1 — DNS no Hostinger](#fase-1--configurar-o-dns-no-hostinger)
5. [Fase 2 — Gerar segredos](#fase-2--gerar-segredos)
6. [Fase 3 — Projeto no EasyPanel + Postgres](#fase-3--criar-o-projeto-no-easypanel--serviço-de-banco)
7. [Fase 4 — Serviço Backend](#fase-4--subir-o-serviço-backend)
8. [Fase 5 — Serviço Frontend](#fase-5--subir-o-serviço-frontend)
9. [Fase 6 — Popular o banco e trocar credenciais](#fase-6--popular-o-banco-e-trocar-credenciais)
10. [Fase 7 — Smoke test](#fase-7--smoke-test-em-produção)
11. [Fase 8 — Hardening pós-deploy](#fase-8--hardening-pós-deploy)

---

## 1. Antes de começar

Ao final, você terá:

- Frontend acessível via `https://seudominio.com`
- API acessível via `https://api.seudominio.com`
- O site de reservas da Algas Marinhas em `https://seudominio.com/reservar/algas-marinhas`, com fotos e conteúdo reais
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
seudominio.com       → frontend (interface web + site da Algas Marinhas)
api.seudominio.com   → backend (API JSON)
```

Domínios separados deixam o CORS explícito e facilitam debug.

### 2.4 — Build time vs Runtime

| Categoria | Quando é lida | Exemplo | Mudou? |
|---|---|---|---|
| **Build time** | Durante o build da imagem | `VITE_API_URL` (Vite congela no JS final) | Precisa **Implantar** (rebuild) |
| **Runtime** | Quando o container roda | `JWT_ACCESS_SECRET`, `DATABASE_URL` | Basta **Reiniciar** |

**Regra de bolso:** mudou variável do frontend → Implantar. Mudou variável do backend → Reiniciar.

### 2.5 — Fotos e uploads: como funcionam em produção

As fotos reais da Algas Marinhas (e de qualquer cliente futuro) ficam em
`backend/public/uploads/<slug-do-cliente>/`, servidas pelo Express em `/uploads/...`.
**Não é um volume separado nem um serviço de storage** — os arquivos são
**parte do repositório Git** e entram na imagem Docker no build (`COPY . .` no
`backend/Dockerfile`). Isso significa:

- Para uma foto aparecer em produção, ela precisa estar **commitada no Git**.
- Trocar uma foto = trocar o arquivo, `git push`, **Implantar** o backend (rebuild).
- Não existe upload direto pelo painel admin ainda (ver `.docs/plano-construcao-algas-marinhas.html`, Fase 02) — por enquanto é sempre via commit.

---

## 3. Checklist pré-deploy específico do Lumina

Antes de tocar no EasyPanel, confira estes três pontos — são armadilhas reais
deste projeto, não teóricas:

- [ ] **`backend/public/uploads/` está commitado no Git.** Rode `git status` —
      se aparecer como `??` (untracked), as fotos da Algas Marinhas **não vão**
      para produção. `git add backend/public/uploads && git commit`.
- [ ] **Decisão sobre o seed** (`backend/prisma/seed.ts`): ele cria contas de
      teste com senhas conhecidas (`super123`, `admin123`, `staff123`,
      `algas123`) **e** a organização real da Algas Marinhas com todo o
      conteúdo já preparado (quartos, fotos, gastronomia, formas de pagamento).
      Rodar o seed em produção é o caminho mais rápido para a Algas Marinhas
      já nascer online — mas **as senhas de teste têm que ser trocadas
      imediatamente depois** (Fase 6 cobre isso).
- [ ] **`.env` não commitado.** Confirme que `backend/.env` e `frontend/.env`
      não aparecem em `git status` (o `.gitignore` já cobre isso, mas vale
      conferir uma vez).

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
5. Ative **Backups** automáticos deste serviço agora (aba **Backups**) — antes de ter dados reais é o melhor momento para configurar, não depois.

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
6. Aba **Implantações → Implantar**. Acompanhe os logs — deve terminar com
   `Database connected successfully` e `Server running on port 3001`.
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

## Fase 6 — Popular o banco e trocar credenciais

Deploy zerado: o `npm run start:prod` do backend já roda `prisma db push`
automaticamente ao subir — o schema entra sozinho, sem passo manual.

**Para colocar a Algas Marinhas no ar já com todo o conteúdo preparado**
(quartos, fotos, tarifas de exemplo, gastronomia, formas de pagamento):

1. EasyPanel → `lumina-backend` → aba **Console**
2. Rode:
   ```bash
   cd /app
   npx tsx prisma/seed.ts
   ```
3. Confira a saída — deve listar a criação da organização e das credenciais de teste.

**Imediatamente depois, troque as senhas de teste** (o seed usa senhas
conhecidas e públicas neste repositório — nunca deixe assim em produção):

1. Faça login com `superadmin@lumina.com` / `super123`.
2. Vá em Equipe (ou direto no banco, via console do `lumina-postgres`) e troque
   a senha de **todos** os usuários criados pelo seed:
   `superadmin@lumina.com`, `admin@lumina.com`, `staff@lumina.com`,
   `admin@algasmarinhas.com`.
3. Se as organizações de teste (`Restaurante Sabor & Arte`) e as contas
   genéricas (`admin@lumina.com`, `staff@lumina.com`) não fizerem sentido em
   produção, apague-as pelo painel de Super Admin — a organização
   `algas-marinhas` e o `admin@algasmarinhas.com` são os únicos dados reais.

> Alternativa mais cautelosa: **não rode o seed**, crie o super admin via
> `/setup`, cadastre a Algas Marinhas manualmente pelo painel (tipo Pousada) e
> preencha o conteúdo pela tela **Site & Conteúdo** — mais lento, mas evita
> qualquer credencial padrão em produção, mesmo que trocada depois.

---

## Fase 7 — Smoke test em produção

Em aba anônima, confira:

- [ ] Tela de login carrega (sem 502/503)
- [ ] HTTPS com cadeado válido nos dois domínios
- [ ] Login funciona (com a senha **já trocada**, não a do seed)
- [ ] Dashboard mostra dados reais
- [ ] `https://seudominio.com/reservar/algas-marinhas` abre com fotos reais, identidade visual correta (verde/navy/dourado, Marcellus/Figtree) e o formulário de reserva funciona de ponta a ponta (faça uma reserva de teste e confira que ela aparece no painel)
- [ ] Menu lateral do admin da Algas Marinhas mostra "Site & Conteúdo" e "Reservas externas" (não mostra PDV Restaurante, já que é uma pousada pura)
- [ ] DevTools → Network: chamadas vão para `https://api.seudominio.com/api/...` com status 200
- [ ] Logs do backend sem erros 5xx recorrentes

---

## Fase 8 — Hardening pós-deploy

1. Confirme que **todas** as senhas de teste da Fase 6 foram trocadas.
2. Confirme que `backend/.env` e `frontend/.env` **não** estão commitados (`.gitignore` já cobre isso).
3. Configure backup automático do Postgres no EasyPanel (aba **Backups** do serviço `lumina-postgres`), idealmente com destino externo — se ainda não fez na Fase 3.
4. Monitore logs nas primeiras 24–48h.
5. Quando coletar a URL de export ICS da Booking.com com a proprietária da Algas Marinhas, cadastre-a na tela **Site & Conteúdo → Quartos** de cada tipo de quarto — isso liga a sincronização gratuita descrita em `.docs/plano-construcao-algas-marinhas.html`.

---

# PARTE 2 — Atualizações futuras (leia antes de todo `git push` em produção)

> A partir daqui, o Lumina está em uso real. As regras abaixo existem porque
> um deploy malfeito pode apagar a reserva de um hóspede de verdade.

## ⚡ Manual Rápido (TL;DR)

**Mudou só frontend/lógica (sem schema)?** → `git push origin main` + Implantar no EasyPanel. **Fim.**

**Mudou `schema.prisma`?** Siga os passos:

```bash
# 0) BACKUP — console do lumina-postgres
pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > /tmp/lumina-backup-$(date +%F-%H%M).sql

# 1) CÓDIGO — no seu PC (não esqueça backend/public/uploads se mudou fotos)
git push origin main

# 2) IMPLANTAR — EasyPanel: lumina-backend e/ou lumina-frontend
#    (conferir VITE_API_URL como Build Arg no lumina-frontend, se mudou)

# 3) SCHEMA — normalmente automático (start:prod roda `prisma db push`),
#    mas se quiser aplicar manualmente antes do restart:
cd /app && npx prisma db push --skip-generate

# 4) CONFERIR — abrir o site + reservas existentes continuam lá
```

> 🔒 **Regra inquebrável:** só mudanças **aditivas** (tabela nova, coluna nullable,
> valor novo de enum). **Nunca** rode `--force-reset`, `migrate reset`,
> `db:seed` (recriaria/duplicaria dados de teste em cima de dados reais) ou
> `--accept-data-loss` em produção. Se o `db push` falar em *"data loss"*,
> **PARE** — a mudança não era aditiva.

---

## 🛑 Regras de Ouro (NUNCA quebrar)

| ⛔ Comando | Por que é proibido |
|---|---|
| `prisma db push --force-reset` | **Apaga o banco inteiro** antes de aplicar |
| `prisma migrate reset` | Idem — recria do zero |
| `npx tsx prisma/seed.ts` (depois do primeiro deploy) | Cria de novo as contas de teste e a organização `algas-marinhas` com `upsert` — se os dados reais já mudaram, o seed **sobrescreve conteúdo real com os valores de exemplo do código** |
| `prisma db push --accept-data-loss` | Ignora avisos de perda de dados — **se o push pedir isso, PARE** |

> ✅ O comando seguro para aplicar schema é **`npx prisma db push`** (sem flags
> destrutivas). Ele só aplica mudanças **aditivas** sem tocar nos dados.

---

## 🧭 Princípio: mudança **aditiva** vs **destrutiva**

| ✅ Aditivo (seguro, sem perda) | ⚠️ Destrutivo (exige cuidado/planejamento) |
|---|---|
| Adicionar **tabela** nova | Remover/renomear tabela |
| Adicionar **coluna nullable** (`String?`) | Remover/renomear coluna |
| Adicionar **valor a um enum/string livre** | Remover valor usado por dado existente |
| Adicionar **índice/relação** | Mudar tipo de coluna (ex: `String`→`Int`) |
| Adicionar coluna com `@default(...)` | Adicionar coluna `NOT NULL` sem default em tabela populada |

> Se a sua mudança cair na coluna da direita, **não faça push direto**: planeje
> uma migração em etapas (adicionar → backfill → remover depois) e **sempre**
> faça backup antes. Na dúvida, trate como destrutivo.

---

## ✅ Checklist rápido de atualização

```
[ ] 0. Backup do banco (pg_dump)              → lumina-postgres, se mudou schema
[ ] 1. git push origin main                   → no seu PC (incluir fotos novas!)
[ ] 2. Implantar lumina-backend/-frontend      → EasyPanel
[ ] 3. Conferir logs do backend (sem erro no db push automático)
[ ] 4. Verificar o site + o /reservar/algas-marinhas em produção
```

---

## ⏪ Rollback (se algo der errado)

1. **Código:** no EasyPanel, faça **re-deploy do commit anterior** (estável) em cada serviço afetado.
2. **Banco** (só se necessário — raríssimo com mudança aditiva): restaure o dump do backup, no console do `lumina-postgres`:
   ```bash
   psql -U "$POSTGRES_USER" "$POSTGRES_DB" < /tmp/lumina-backup-<data>.sql
   ```

> Como o caminho seguro usa apenas mudanças **aditivas**, o banco quase nunca
> precisa de rollback — o código volta, o banco fica (compatível).

---

## ⚠️ Armadilhas conhecidas do projeto

| Tema | Cuidado |
|---|---|
| **VITE_API_URL** | É **Build Arg** do lumina-frontend, não env var de runtime. Faltando ou desatualizado = site sem API. Toda troca exige **Implantar**, não Reiniciar. |
| **Fotos em `backend/public/uploads/`** | Não são um volume — são commitadas no Git e entram na imagem no build. Trocar uma foto sem commitar não muda nada em produção. |
| **`prisma/seed.ts` é idempotente por `upsert`, não por "seguro para produção"** | Rodar de novo depois que os dados reais mudaram **sobrescreve** o que foi editado pelo admin (tarifas, descrições) com os valores de exemplo do código. Só rode uma vez, no primeiro deploy. |
| **CORS** | Aceita `*.easypanel.host` por regex + os domínios em `ALLOWED_ORIGINS`. O domínio próprio precisa estar explicitamente em `ALLOWED_ORIGINS`. |
| **Migração só roda automática no start, nunca manual "sozinha"** | O EasyPanel não roda `db push` por conta própria fora do `start:prod` do container — se editar `schema.prisma` sem reimplantar o backend, nada muda em produção. |
| **`node-ical` e outras deps novas** | Instaladas automaticamente pelo `npm ci` no build — nada de especial a fazer, só garantir que `package-lock.json` foi commitado junto com o `package.json`. |
| **Healthcheck do backend** | Usa `${PORT:-3001}` — se mudar a variável `PORT` do serviço, o healthcheck já acompanha sozinho (corrigido para não ficar hardcoded em 3001). |

---

## 📌 Resumo de uma linha

> **Backup (se mudou schema) → push → implantar → conferir logs → testar o site e o `/reservar/algas-marinhas`.**
> Aditivo sempre. Destrutivo nunca sem plano. Seed só uma vez. Progresso, jamais regressão.
