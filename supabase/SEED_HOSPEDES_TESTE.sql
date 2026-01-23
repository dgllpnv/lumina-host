-- ============================================================
-- LUMINA HOST - SEED DE EMERGÊNCIA: HÓSPEDES COM CHECK-IN ATIVO
-- Execute este SQL no Supabase SQL Editor para popular dados de teste
-- ============================================================

-- Primeiro, vamos verificar se há uma organização para vincular
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Buscar a primeira organização disponível
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'ATENÇÃO: Nenhuma organização encontrada. Criando uma de teste...';
    INSERT INTO organizations (id, nome, tipo, plano, ativo)
    VALUES (gen_random_uuid(), 'Hotel Lumina Teste', 'hotel', 'premium', true)
    RETURNING id INTO v_org_id;
  END IF;

  RAISE NOTICE 'Usando organização: %', v_org_id;

  -- Limpar reservas de teste anteriores (opcional)
  DELETE FROM reservations WHERE guest_name IN ('Davi Lopes', 'Hóspede VIP', 'Maria Santos');

  -- Inserir Hóspede 1: Davi Lopes - Quarto 101
  INSERT INTO reservations (
    id,
    organization_id,
    room_number,
    room_type,
    guest_name,
    guest_email,
    guest_phone,
    checkin_date,
    checkout_date,
    actual_checkin,
    status,
    daily_rate,
    total_stay
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    '101',
    'Standard',
    'Davi Lopes',
    'davi@email.com',
    '(11) 99999-1234',
    NOW(),
    NOW() + INTERVAL '3 days',
    NOW(),
    'checkin',
    280.00,
    840.00
  );

  -- Inserir Hóspede 2: Hóspede VIP - Quarto 202
  INSERT INTO reservations (
    id,
    organization_id,
    room_number,
    room_type,
    guest_name,
    guest_email,
    guest_phone,
    checkin_date,
    checkout_date,
    actual_checkin,
    status,
    daily_rate,
    total_stay
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    '202',
    'Luxo',
    'Hóspede VIP',
    'vip@email.com',
    '(11) 98888-5678',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '4 days',
    NOW() - INTERVAL '1 day',
    'checkin',
    420.00,
    2100.00
  );

  -- Inserir Hóspede 3: Maria Santos - Quarto 301 (Suíte)
  INSERT INTO reservations (
    id,
    organization_id,
    room_number,
    room_type,
    guest_name,
    guest_email,
    guest_phone,
    checkin_date,
    checkout_date,
    actual_checkin,
    status,
    daily_rate,
    total_stay
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    '301',
    'Suíte Master',
    'Maria Santos',
    'maria.santos@email.com',
    '(11) 97777-9999',
    NOW(),
    NOW() + INTERVAL '2 days',
    NOW(),
    'checkin',
    850.00,
    1700.00
  );

  RAISE NOTICE 'SUCESSO: 3 hóspedes inseridos com check-in ativo!';
END $$;

-- Verificação: Mostrar hóspedes com check-in ativo
SELECT
  guest_name,
  room_number,
  room_type,
  status,
  checkin_date::date as checkin,
  checkout_date::date as checkout
FROM reservations
WHERE status = 'checkin'
ORDER BY room_number;
