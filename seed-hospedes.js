/**
 * Script para inserir hóspedes de teste com check-in ativo
 * Execute: node seed-hospedes.js
 */

const SUPABASE_URL = 'https://hzozuldxgqprcnlpeovt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b3p1bGR4Z3FwcmNubHBlb3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc5OTcsImV4cCI6MjA4NDEwMzk5N30.KuprsDLa_fJCis0_WNf5hkhHGg-aNHil5stQs6ZevJ8';

async function seedHospedes() {
  console.log('='.repeat(60));
  console.log('SEED DE HÓSPEDES COM CHECK-IN ATIVO');
  console.log('='.repeat(60));
  console.log('');

  // 1. Login para obter token
  console.log('1. Fazendo login...');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'super@lumina.com', password: '123456' })
  });
  const loginData = await loginRes.json();

  if (!loginData.access_token) {
    console.log('   Tentando com admin@restaurante.com...');
    const loginRes2 = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@restaurante.com', password: '123456' })
    });
    const loginData2 = await loginRes2.json();
    if (!loginData2.access_token) {
      console.log('   ❌ Erro no login. Continuando sem autenticação...');
    } else {
      loginData.access_token = loginData2.access_token;
    }
  }
  console.log('   ✅ Login OK');
  const token = loginData.access_token;

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  // 2. Buscar organização
  console.log('');
  console.log('2. Buscando organização...');
  const orgRes = await fetch(`${SUPABASE_URL}/rest/v1/organizations?limit=1`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  const orgs = await orgRes.json();

  let orgId = null;
  if (Array.isArray(orgs) && orgs.length > 0) {
    orgId = orgs[0].id;
    console.log(`   ✅ Organização encontrada: ${orgs[0].nome} (${orgId})`);
  } else {
    console.log('   ⚠️ Nenhuma organização encontrada. Criando uma...');
    const newOrgRes = await fetch(`${SUPABASE_URL}/rest/v1/organizations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nome: 'Hotel Lumina Teste',
        tipo: 'pousada',
        plano: 'premium',
        ativo: true
      })
    });
    const newOrg = await newOrgRes.json();
    if (Array.isArray(newOrg) && newOrg[0]?.id) {
      orgId = newOrg[0].id;
      console.log(`   ✅ Organização criada: ${orgId}`);
    }
  }

  if (!orgId) {
    console.log('   ❌ Não foi possível obter organização. Abortando.');
    return;
  }

  // 3. Verificar reservas existentes
  console.log('');
  console.log('3. Verificando reservas existentes...');
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/reservations?status=eq.checkin&select=guest_name,room_number`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  const existing = await existingRes.json();

  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`   ⚠️ Já existem ${existing.length} hóspedes com check-in ativo:`);
    existing.forEach(r => console.log(`      - ${r.guest_name} (Quarto ${r.room_number})`));
    console.log('');
    console.log('   Deseja continuar e adicionar mais? (adicionando mesmo assim...)');
  }

  // 4. Inserir hóspedes de teste
  console.log('');
  console.log('4. Inserindo hóspedes de teste...');

  const now = new Date();
  const hospedes = [
    {
      organization_id: orgId,
      room_number: '101',
      room_type: 'Standard',
      guest_name: 'Davi Lopes',
      guest_email: 'davi@email.com',
      guest_phone: '(11) 99999-1234',
      checkin_date: now.toISOString(),
      checkout_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      actual_checkin: now.toISOString(),
      status: 'checkin',
      daily_rate: 280.00,
      total_stay: 840.00
    },
    {
      organization_id: orgId,
      room_number: '202',
      room_type: 'Luxo',
      guest_name: 'Hóspede VIP',
      guest_email: 'vip@email.com',
      guest_phone: '(11) 98888-5678',
      checkin_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      checkout_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      actual_checkin: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'checkin',
      daily_rate: 420.00,
      total_stay: 2100.00
    },
    {
      organization_id: orgId,
      room_number: '301',
      room_type: 'Suíte Master',
      guest_name: 'Maria Santos',
      guest_email: 'maria.santos@email.com',
      guest_phone: '(11) 97777-9999',
      checkin_date: now.toISOString(),
      checkout_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      actual_checkin: now.toISOString(),
      status: 'checkin',
      daily_rate: 850.00,
      total_stay: 1700.00
    }
  ];

  for (const hospede of hospedes) {
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(hospede)
    });

    const result = await insertRes.json();

    if (insertRes.ok) {
      console.log(`   ✅ ${hospede.guest_name} - Quarto ${hospede.room_number}`);
    } else {
      console.log(`   ❌ Erro ao inserir ${hospede.guest_name}:`, result.message || result);
    }
  }

  // 5. Verificar resultado final
  console.log('');
  console.log('5. Verificando hóspedes com check-in ativo...');
  const finalRes = await fetch(`${SUPABASE_URL}/rest/v1/reservations?status=eq.checkin&select=guest_name,room_number,room_type`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  const finalData = await finalRes.json();

  console.log('');
  console.log('='.repeat(60));
  console.log('RESULTADO: SELECT guest_name, room_number FROM reservations WHERE status = \'checkin\'');
  console.log('='.repeat(60));

  if (Array.isArray(finalData) && finalData.length > 0) {
    console.log('');
    console.log('   guest_name          | room_number | room_type');
    console.log('   ' + '-'.repeat(50));
    finalData.forEach(r => {
      console.log(`   ${r.guest_name.padEnd(18)} | ${r.room_number.padEnd(11)} | ${r.room_type}`);
    });
    console.log('');
    console.log(`   ✅ Total: ${finalData.length} hóspedes com check-in ativo`);
    console.log('');
    console.log('   🎉 O Restaurante agora verá esses quartos!');
  } else {
    console.log('   ❌ Nenhum hóspede encontrado. Verifique as permissões RLS.');
  }

  console.log('');
  console.log('='.repeat(60));
}

seedHospedes().catch(console.error);
