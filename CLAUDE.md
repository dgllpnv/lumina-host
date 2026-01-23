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

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **State:** TanStack Query (React Query)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Gráficos:** Recharts
- **Animações:** Framer Motion

## ESTRUTURA DO PROJETO

```
lumina-host/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   │   ├── dashboard/  # Cards e gráficos do dashboard
│   │   ├── layout/     # AppLayout, Sidebar, Header
│   │   └── ui/         # Componentes shadcn/ui
│   ├── contexts/       # React Contexts (Organization, Auth)
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Configuração Supabase
│   ├── pages/          # Páginas da aplicação
│   └── lib/            # Utilitários
├── public/             # Arquivos estáticos
├── package.json        # Dependências
└── vite.config.ts      # Configuração Vite
```

## COMO INICIAR A APLICAÇÃO

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passo 1: Navegar até a pasta do projeto

```bash
cd "C:\Users\DAVI LOPES\Documents\Projetos Code\lumina-host"
```

### Passo 2: Instalar dependências (se necessário)

```bash
npm install
```

### Passo 3: Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

### Passo 4: Verificar se está rodando

O servidor inicia na porta **8080** por padrão. Se estiver ocupada, usa a próxima disponível.

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
```

Resposta esperada: `200`

## URLS DA APLICAÇÃO

| Página | URL |
|--------|-----|
| Login | http://localhost:8080/ |
| Dashboard | http://localhost:8080/dashboard |
| PDV Restaurante | http://localhost:8080/pos-restaurante |
| Estoque | http://localhost:8080/estoque |
| Financeiro | http://localhost:8080/financeiro |
| Equipe | http://localhost:8080/equipe |
| Configurações | http://localhost:8080/configuracoes |

## COMANDOS DISPONÍVEIS

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Verifica erros de código |

## SOLUÇÃO DE PROBLEMAS

### Erro: "Port 8080 is in use"

O Vite automaticamente usa a próxima porta disponível (8081, 8082, etc.).

Para liberar a porta manualmente:

**Windows:**
```bash
netstat -ano | findstr :8080
taskkill /PID <numero_do_pid> /F
```

**Mac/Linux:**
```bash
lsof -i :8080
kill -9 <PID>
```

### Erro: "Module not found"

Reinstale as dependências:

```bash
rm -rf node_modules
npm install
```

### Tela branca ou erro no navegador

Limpe o cache do Vite:

```bash
rm -rf node_modules/.vite
npm run dev
```

## IMPORTANTE PARA O CLAUDE

1. **SEMPRE** verificar se `node_modules` existe antes de rodar `npm run dev`
2. Se não existir, rodar `npm install` primeiro
3. A porta padrão é **8080**, mas pode mudar se estiver ocupada
4. Verificar o output do terminal para saber a porta correta
5. O projeto usa **Supabase** como backend - não precisa subir backend separado
6. Confirmar funcionamento com `curl` ou abrindo no navegador

## VARIÁVEIS DE AMBIENTE

O projeto usa Supabase. As variáveis estão em `src/integrations/supabase/client.ts`:

- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Chave anônima do Supabase

## BACKEND (SUPABASE)

O backend é gerenciado pelo Supabase e inclui:

- **Autenticação:** Login/logout com email/senha
- **Banco de dados:** PostgreSQL com RLS (Row Level Security)
- **Realtime:** Atualizações em tempo real
- **Storage:** Armazenamento de arquivos

As tabelas principais estão em `src/integrations/supabase/types.ts`.

## FLUXO DE USO

1. Usuário acessa a aplicação
2. Faz login com credenciais
3. É redirecionado para o Dashboard
4. Navega pelas funcionalidades via Sidebar
5. Dados são sincronizados em tempo real com Supabase

---

**Lumina Host - Sistema de Gestão para Hospitalidade**
