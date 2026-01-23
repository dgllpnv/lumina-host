-- ============================================================================
-- MIGRACAO CONSOLIDADA: Criar tabelas faltantes + Enterprise Upgrade
-- Data: 2026-01-17
-- Descricao: Cria tabelas que estao faltando e aplica todas as melhorias
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR ENUMS SE NAO EXISTIREM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('receita', 'despesa');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pendente', 'pago', 'cancelado', 'atrasado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.table_room_status AS ENUM ('livre', 'ocupado', 'sujo', 'reservado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('reservado', 'checkin', 'checkout', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PARTE 2: CRIAR TABELAS FALTANTES
-- ============================================================================

-- Tabela de transacoes financeiras
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tipo transaction_type NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  metodo_pagto TEXT,
  status transaction_status NOT NULL DEFAULT 'pendente',
  data_vencimento DATE,
  data_pagamento DATE,
  reservation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de estoque
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_unitario DECIMAL(10,2),
  estoque_minimo DECIMAL(10,2) DEFAULT 0,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mesas/quartos
CREATE TABLE IF NOT EXISTS public.tables_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'mesa',
  capacidade INTEGER DEFAULT 4,
  status table_room_status NOT NULL DEFAULT 'livre',
  andar INTEGER,
  descricao TEXT,
  preco_base DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de reservas
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
  status reservation_status NOT NULL DEFAULT 'reservado',
  daily_rate DECIMAL(10,2) NOT NULL,
  total_stay DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar FK de reservation_id em financial_transactions
DO $$ BEGIN
  ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_reservation_id_fkey
  FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PARTE 3: INDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_financial_transactions_org ON public.financial_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reservation ON public.financial_transactions(reservation_id) WHERE reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_org ON public.inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_tables_rooms_org ON public.tables_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_organization ON public.reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_number);

-- ============================================================================
-- PARTE 4: TRIGGERS UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tables_rooms_updated_at ON public.tables_rooms;
CREATE TRIGGER update_tables_rooms_updated_at
  BEFORE UPDATE ON public.tables_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PARTE 5: FUNCOES HELPER
-- ============================================================================

-- Funcao para verificar se e super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

-- Funcao para obter organization_id do usuario atual
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Funcao para obter organization_id de um usuario especifico
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- ============================================================================
-- PARTE 6: HABILITAR RLS
-- ============================================================================

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 7: RLS POLICIES - FINANCIAL_TRANSACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view org transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can insert org transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can update org transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can delete org transactions" ON public.financial_transactions;

CREATE POLICY "Users can view org transactions"
ON public.financial_transactions FOR SELECT
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can insert org transactions"
ON public.financial_transactions FOR INSERT
WITH CHECK (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can update org transactions"
ON public.financial_transactions FOR UPDATE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can delete org transactions"
ON public.financial_transactions FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- ============================================================================
-- PARTE 8: RLS POLICIES - INVENTORY_ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete org inventory" ON public.inventory_items;

CREATE POLICY "Users can view org inventory"
ON public.inventory_items FOR SELECT
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can insert org inventory"
ON public.inventory_items FOR INSERT
WITH CHECK (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can update org inventory"
ON public.inventory_items FOR UPDATE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can delete org inventory"
ON public.inventory_items FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- ============================================================================
-- PARTE 9: RLS POLICIES - TABLES_ROOMS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view org tables_rooms" ON public.tables_rooms;
DROP POLICY IF EXISTS "Users can insert org tables_rooms" ON public.tables_rooms;
DROP POLICY IF EXISTS "Users can update org tables_rooms" ON public.tables_rooms;
DROP POLICY IF EXISTS "Users can delete org tables_rooms" ON public.tables_rooms;

CREATE POLICY "Users can view org tables_rooms"
ON public.tables_rooms FOR SELECT
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can insert org tables_rooms"
ON public.tables_rooms FOR INSERT
WITH CHECK (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can update org tables_rooms"
ON public.tables_rooms FOR UPDATE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can delete org tables_rooms"
ON public.tables_rooms FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- ============================================================================
-- PARTE 10: RLS POLICIES - RESERVATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view org reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert org reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update org reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete org reservations" ON public.reservations;
DROP POLICY IF EXISTS "reservations_super_admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations_org_select" ON public.reservations;
DROP POLICY IF EXISTS "reservations_org_insert" ON public.reservations;
DROP POLICY IF EXISTS "reservations_org_update" ON public.reservations;

CREATE POLICY "Users can view org reservations"
ON public.reservations FOR SELECT
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can insert org reservations"
ON public.reservations FOR INSERT
WITH CHECK (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can update org reservations"
ON public.reservations FOR UPDATE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

CREATE POLICY "Users can delete org reservations"
ON public.reservations FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- ============================================================================
-- PARTE 11: FUNCAO admin_create_user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_nome TEXT,
  p_role app_role DEFAULT 'staff'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_caller_role app_role;
BEGIN
  -- Verificar se o chamador tem permissao (admin ou super_admin)
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas administradores podem criar usuarios'
    );
  END IF;

  -- Obter organization_id do chamador
  SELECT organization_id INTO v_org_id FROM profiles WHERE id = auth.uid();

  IF v_org_id IS NULL AND v_caller_role != 'super_admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voce precisa estar associado a uma organizacao'
    );
  END IF;

  -- Verificar se admin esta tentando criar super_admin (nao permitido)
  IF v_caller_role = 'admin' AND p_role = 'super_admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem criar outros super admins'
    );
  END IF;

  -- Criar usuario no auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  )
  VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', p_nome),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO v_user_id;

  -- Atualizar o profile criado pelo trigger com os dados corretos
  UPDATE profiles
  SET
    nome = p_nome,
    role = p_role,
    organization_id = v_org_id
  WHERE id = v_user_id;

  -- Atualizar ou inserir na user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, p_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

  -- Remover role staff se foi atribuido outro role
  IF p_role != 'staff' THEN
    DELETE FROM user_roles WHERE user_id = v_user_id AND role = 'staff';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'nome', p_nome,
    'role', p_role,
    'organization_id', v_org_id
  );

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Email ja esta em uso'
  );
WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- ============================================================================
-- PARTE 12: FUNCOES RPC PARA HOSPEDES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_guest_charges(p_reservation_id UUID)
RETURNS TABLE (
  id UUID,
  descricao TEXT,
  valor DECIMAL(10,2),
  categoria TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ft.id,
    ft.descricao,
    ft.valor,
    ft.categoria,
    ft.status::TEXT,
    ft.created_at
  FROM financial_transactions ft
  WHERE ft.reservation_id = p_reservation_id
  ORDER BY ft.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_guest_total(p_reservation_id UUID)
RETURNS TABLE (
  total_pendente DECIMAL(10,2),
  total_pago DECIMAL(10,2),
  total_geral DECIMAL(10,2),
  num_lancamentos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN ft.status = 'pendente' THEN ft.valor ELSE 0 END), 0) as total_pendente,
    COALESCE(SUM(CASE WHEN ft.status = 'pago' THEN ft.valor ELSE 0 END), 0) as total_pago,
    COALESCE(SUM(ft.valor), 0) as total_geral,
    COUNT(*)::INTEGER as num_lancamentos
  FROM financial_transactions ft
  WHERE ft.reservation_id = p_reservation_id;
END;
$$;

-- ============================================================================
-- PARTE 13: GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_organization_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_charges TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_total TO authenticated;

-- ============================================================================
-- VERIFICACAO FINAL
-- ============================================================================

SELECT 'Migracao consolidada concluida com sucesso!' as status;
