/**
 * Script de Teste de Autenticação RBAC
 * Execute após aplicar o SQL no Supabase
 *
 * Uso: node test-auth.js
 */

const SUPABASE_URL = "https://hzozuldxgqprcnlpeovt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b3p1bGR4Z3FwcmNubHBlb3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc5OTcsImV4cCI6MjA4NDEwMzk5N30.KuprsDLa_fJCis0_WNf5hkhHGg-aNHil5stQs6ZevJ8";

const TEST_USERS = [
  { email: "super@lumina.com", password: "123456", expectedRole: "super_admin", expectedRoute: "/admin/organizations" },
  { email: "admin@restaurante.com", password: "123456", expectedRole: "admin", expectedRoute: "/dashboard" },
  { email: "staff@restaurante.com", password: "123456", expectedRole: "staff", expectedRoute: "/pos-restaurante" },
];

async function login(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}

async function callRPC(token, functionName) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.json();
}

async function queryTable(token, table, filter) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "GET",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.json();
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("TESTES DE AUTENTICAÇÃO RBAC - LUMINA HOST");
  console.log("=".repeat(60));
  console.log("");

  let passedTests = 0;
  let failedTests = 0;

  for (const testUser of TEST_USERS) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`TESTANDO: ${testUser.email}`);
    console.log(`${"─".repeat(50)}`);

    // Teste 1: Login
    console.log("\n1. Tentando login...");
    const loginResult = await login(testUser.email, testUser.password);

    if (loginResult.error) {
      console.log(`   ❌ FALHA no login: ${loginResult.error_description || loginResult.error}`);
      failedTests++;
      continue;
    }

    if (!loginResult.access_token) {
      console.log(`   ❌ FALHA: Token não retornado`);
      failedTests++;
      continue;
    }

    console.log(`   ✅ Login bem-sucedido`);
    console.log(`   └─ User ID: ${loginResult.user?.id}`);

    const token = loginResult.access_token;
    const userId = loginResult.user?.id;

    // Teste 2: RPC get_my_profile
    console.log("\n2. Testando RPC get_my_profile...");
    const profileResult = await callRPC(token, "get_my_profile");

    if (profileResult.code) {
      console.log(`   ❌ FALHA na RPC: ${profileResult.message}`);
      console.log(`   └─ Detalhes: ${profileResult.details || "N/A"}`);

      // Fallback: tentar ler direto da tabela
      console.log("\n   Tentando fallback (leitura direta)...");
      const directProfile = await queryTable(token, "profiles", `id=eq.${userId}`);
      const directRole = await queryTable(token, "user_roles", `user_id=eq.${userId}`);

      if (Array.isArray(directProfile) && directProfile.length > 0) {
        console.log(`   ⚠️  Fallback parcial - Profile encontrado`);
        console.log(`   └─ Role no profile: ${directProfile[0]?.role}`);
      }

      if (Array.isArray(directRole) && directRole.length > 0) {
        console.log(`   ⚠️  Fallback parcial - Role encontrada`);
        console.log(`   └─ Role no user_roles: ${directRole[0]?.role}`);

        // Verificar se role está correta
        const actualRole = directRole[0]?.role;
        if (actualRole === testUser.expectedRole) {
          console.log(`   ✅ Role correta: ${actualRole}`);
          passedTests++;
        } else {
          console.log(`   ❌ Role INCORRETA: esperado "${testUser.expectedRole}", encontrado "${actualRole}"`);
          failedTests++;
        }
      } else {
        failedTests++;
      }

      continue;
    }

    // Sucesso na RPC
    console.log(`   ✅ RPC retornou dados`);
    console.log(`   └─ ID: ${profileResult.id}`);
    console.log(`   └─ Nome: ${profileResult.nome}`);
    console.log(`   └─ Email: ${profileResult.email}`);
    console.log(`   └─ Role: ${profileResult.role}`);
    console.log(`   └─ Organization: ${profileResult.organization_id || "N/A"}`);

    // Teste 3: Verificar role
    console.log("\n3. Verificando role...");
    if (profileResult.role === testUser.expectedRole) {
      console.log(`   ✅ Role correta: ${profileResult.role}`);
      passedTests++;
    } else {
      console.log(`   ❌ Role INCORRETA`);
      console.log(`   └─ Esperado: ${testUser.expectedRole}`);
      console.log(`   └─ Encontrado: ${profileResult.role}`);
      failedTests++;
    }

    // Teste 4: Rota esperada
    console.log("\n4. Rota esperada após login:");
    console.log(`   📍 ${testUser.expectedRoute}`);
  }

  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("RESUMO DOS TESTES");
  console.log("=".repeat(60));
  console.log(`✅ Testes passados: ${passedTests}`);
  console.log(`❌ Testes falhados: ${failedTests}`);
  console.log(`📊 Total: ${passedTests + failedTests}`);

  if (failedTests === 0 && passedTests === TEST_USERS.length) {
    console.log("\n🎉 TODOS OS TESTES PASSARAM!");
  } else if (failedTests > 0) {
    console.log("\n⚠️  ALGUNS TESTES FALHARAM!");
    console.log("   Verifique se o SQL foi aplicado corretamente no Supabase.");
  }

  console.log("\n" + "=".repeat(60));
}

// Executar testes
runTests().catch(console.error);
