/**
 * Script para configurar RBAC no Supabase
 */

const SUPABASE_URL = 'https://hzozuldxgqprcnlpeovt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b3p1bGR4Z3FwcmNubHBlb3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc5OTcsImV4cCI6MjA4NDEwMzk5N30.KuprsDLa_fJCis0_WNf5hkhHGg-aNHil5stQs6ZevJ8';

const SUPER_ID = '454ffe37-1ebf-4e0e-a990-b940fce68e8b';
const ADMIN_ID = '8e09232e-736e-4ab8-b15a-dd4d0a16f101';
const STAFF_ID = 'eaeaeb98-4a81-47af-8ce3-e03e974c0a88';

async function setup() {
  console.log('=== CONFIGURANDO SISTEMA RBAC ===');
  console.log('');

  // 1. Login como super
  console.log('1. Login super@lumina.com...');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'super@lumina.com', password: '123456' })
  });
  const loginData = await loginRes.json();

  if (!loginData.access_token) {
    console.log('   ❌ Erro:', loginData.msg || loginData.error || JSON.stringify(loginData));
    return;
  }
  console.log('   ✅ Login OK');
  const token = loginData.access_token;

  // 2. Promover para super_admin
  console.log('');
  console.log('2. Promovendo para super_admin...');
  const promoteRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/promote_to_super_admin`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ target_user_id: SUPER_ID })
  });
  const promoteData = await promoteRes.json();

  if (promoteData.success) {
    console.log('   ✅ Super admin configurado!');
  } else {
    console.log('   Resultado:', JSON.stringify(promoteData));
  }

  // 3. Novo login para token atualizado
  console.log('');
  console.log('3. Verificando perfil...');
  const login2Res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'super@lumina.com', password: '123456' })
  });
  const login2Data = await login2Res.json();
  const token2 = login2Data.access_token;

  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_profile`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token2}`,
      'Content-Type': 'application/json'
    }
  });
  const profile = await profileRes.json();
  console.log('   Role:', profile.role);

  // 4. Criar organização
  console.log('');
  console.log('4. Criando organização de teste...');
  const orgRes = await fetch(`${SUPABASE_URL}/rest/v1/organizations`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token2}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      nome: 'Restaurante Sabor & Arte',
      tipo: 'restaurante',
      plano: 'premium',
      ativo: true
    })
  });
  const orgData = await orgRes.json();

  let orgId = null;
  if (Array.isArray(orgData) && orgData[0]?.id) {
    orgId = orgData[0].id;
    console.log('   ✅ Organização criada! ID:', orgId);
  } else if (orgData.id) {
    orgId = orgData.id;
    console.log('   ✅ Organização criada! ID:', orgId);
  } else {
    console.log('   ⚠️ Resposta:', JSON.stringify(orgData));
    // Tentar buscar org existente
    const getOrgRes = await fetch(`${SUPABASE_URL}/rest/v1/organizations?limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token2}` }
    });
    const orgs = await getOrgRes.json();
    if (orgs[0]?.id) {
      orgId = orgs[0].id;
      console.log('   ✅ Usando organização existente:', orgId);
    }
  }

  if (orgId) {
    // 5. Configurar admin
    console.log('');
    console.log('5. Configurando admin@restaurante.com...');

    // Deletar role antiga
    await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${ADMIN_ID}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token2}` }
    });

    // Inserir role admin
    await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: ADMIN_ID, role: 'admin' })
    });

    // Atualizar profile
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${ADMIN_ID}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'admin', organization_id: orgId })
    });
    console.log('   ✅ Admin configurado com organização!');

    // 6. Configurar staff
    console.log('');
    console.log('6. Configurando staff@restaurante.com...');

    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${STAFF_ID}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ organization_id: orgId })
    });
    console.log('   ✅ Staff configurado com organização!');
  }

  console.log('');
  console.log('=== CONFIGURAÇÃO CONCLUÍDA ===');
}

setup().catch(console.error);
