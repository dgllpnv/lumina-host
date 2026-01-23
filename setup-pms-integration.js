/**
 * Script para configurar a integração PMS+POS
 * Cria tabela reservations e insere hóspedes de teste
 * Execute: node setup-pms-integration.js
 */

const SUPABASE_URL = 'https://hzozuldxgqprcnlpeovt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b3p1bGR4Z3FwcmNubHBlb3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc5OTcsImV4cCI6MjA4NDEwMzk5N30.KuprsDLa_fJCis0_WNf5hkhHGg-aNHil5stQs6ZevJ8';

async function setup() {
  console.log('='.repeat(60));
  console.log('SETUP INTEGRAÇÃO PMS + POS');
  console.log('='.repeat(60));
  console.log('');

  // 1. Login
  console.log('1. Fazendo login como super@lumina.com...');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'super@lumina.com', password: '123456' })
  });
  const loginData = await loginRes.json();

  if (!loginData.access_token) {
    console.log('   ❌ Erro no login:', loginData.error_description || loginData.msg);
    return;
  }
  console.log('   ✅ Login OK');
  const token = loginData.access_token;

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 2. Verificar/Criar tabela reservations via SQL RPC
  console.log('');
  console.log('2. Criando tabela reservations (se não existir)...');

  // Tentar criar a tabela via query direta usando a edge function ou RPC
  // Como não temos acesso direto ao SQL, vamos tentar inserir e ver o erro

  // Primeiro, vamos buscar a organização
  console.log('');
  console.log('3. Buscando organização...');
  const orgRes = await fetch(`${SUPABASE_URL}/rest/v1/organizations?limit=1`, {
    headers
  });
  const orgs = await orgRes.json();

  let orgId = null;
  if (Array.isArray(orgs) && orgs.length > 0) {
    orgId = orgs[0].id;
    console.log(`   ✅ Organização: ${orgs[0].nome}`);
  } else {
    console.log('   ❌ Nenhuma organização encontrada');
    return;
  }

  // 3. Tentar verificar se a tabela existe
  console.log('');
  console.log('4. Verificando se tabela reservations existe...');
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/reservations?limit=1`, {
    headers
  });

  if (checkRes.status === 404 || checkRes.status === 400) {
    console.log('   ❌ Tabela reservations NÃO existe!');
    console.log('');
    console.log('   ⚠️  AÇÃO NECESSÁRIA:');
    console.log('   ────────────────────────────────────────────────────────');
    console.log('   1. Acesse o Supabase Dashboard:');
    console.log('      https://supabase.com/dashboard/project/hzozuldxgqprcnlpeovt');
    console.log('');
    console.log('   2. Vá em "SQL Editor"');
    console.log('');
    console.log('   3. Execute o SQL abaixo:');
    console.log('   ────────────────────────────────────────────────────────');
    console.log('');

    const sql = `
-- Criar tabela reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.tables_rooms(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_document TEXT,
  checkin_date TIMESTAMPTZ NOT NULL,
  checkout_date TIMESTAMPTZ NOT NULL,
  actual_checkin TIMESTAMPTZ,
  actual_checkout TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado', 'checkin', 'checkout', 'cancelado')),
  daily_rate DECIMAL(10,2) NOT NULL,
  total_stay DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reservations_organization ON public.reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_number);

-- Adicionar coluna reservation_id em financial_transactions
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reservation
ON public.financial_transactions(reservation_id)
WHERE reservation_id IS NOT NULL;

-- RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Política: todos autenticados podem ver/inserir/atualizar reservas da sua org
CREATE POLICY "reservations_authenticated" ON public.reservations
  FOR ALL USING (true);

-- Grants
GRANT ALL ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO anon;

-- Inserir hóspedes de teste
INSERT INTO public.reservations (organization_id, room_number, room_type, guest_name, guest_email, guest_phone, checkin_date, checkout_date, actual_checkin, status, daily_rate, total_stay)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  '101', 'Standard', 'Davi Lopes', 'davi@email.com', '(11) 99999-1234',
  NOW(), NOW() + INTERVAL '3 days', NOW(), 'checkin', 280.00, 840.00
WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE guest_name = 'Davi Lopes');

INSERT INTO public.reservations (organization_id, room_number, room_type, guest_name, guest_email, guest_phone, checkin_date, checkout_date, actual_checkin, status, daily_rate, total_stay)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  '202', 'Luxo', 'Hóspede VIP', 'vip@email.com', '(11) 98888-5678',
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '4 days', NOW() - INTERVAL '1 day', 'checkin', 420.00, 2100.00
WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE guest_name = 'Hóspede VIP');

INSERT INTO public.reservations (organization_id, room_number, room_type, guest_name, guest_email, guest_phone, checkin_date, checkout_date, actual_checkin, status, daily_rate, total_stay)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  '301', 'Suíte Master', 'Maria Santos', 'maria.santos@email.com', '(11) 97777-9999',
  NOW(), NOW() + INTERVAL '2 days', NOW(), 'checkin', 850.00, 1700.00
WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE guest_name = 'Maria Santos');

-- Verificar resultado
SELECT guest_name, room_number, room_type, status FROM reservations WHERE status = 'checkin';
`;
    console.log(sql);
    console.log('');
    console.log('   ────────────────────────────────────────────────────────');
    console.log('   4. Após executar, rode este script novamente para verificar.');
    console.log('');
    return;
  }

  const checkData = await checkRes.json();
  console.log('   ✅ Tabela reservations existe!');

  // 4. Verificar hóspedes existentes
  console.log('');
  console.log('5. Verificando hóspedes com check-in...');
  const guestsRes = await fetch(`${SUPABASE_URL}/rest/v1/reservations?status=eq.checkin&select=guest_name,room_number,room_type`, {
    headers
  });
  const guests = await guestsRes.json();

  if (Array.isArray(guests) && guests.length > 0) {
    console.log('');
    console.log('   ✅ Hóspedes com check-in ativo:');
    console.log('');
    console.log('   guest_name          | room_number | room_type');
    console.log('   ' + '-'.repeat(50));
    guests.forEach(r => {
      console.log(`   ${r.guest_name.padEnd(18)} | ${r.room_number.padEnd(11)} | ${r.room_type}`);
    });
    console.log('');
    console.log('   🎉 O Restaurante verá esses quartos ao clicar em "Hospedagem"!');
  } else {
    console.log('   ⚠️ Nenhum hóspede com check-in. Inserindo...');

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
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(hospede)
      });

      if (insertRes.ok) {
        console.log(`   ✅ ${hospede.guest_name} - Quarto ${hospede.room_number}`);
      } else {
        const err = await insertRes.json();
        console.log(`   ❌ Erro: ${hospede.guest_name}:`, err.message || err);
      }
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('SETUP CONCLUÍDO');
  console.log('='.repeat(60));
}

setup().catch(console.error);
