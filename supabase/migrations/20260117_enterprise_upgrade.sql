-- ============================================================================
-- MIGRACAO: Enterprise Upgrade
-- Data: 2026-01-17
-- Descricao: RLS completo para todas as tabelas, funcao admin_create_user,
--            e campos avancados para quartos (andar, descricao, preco_base)
-- ============================================================================

-- 1. FUNCAO HELPER: get_my_organization_id
-- Retorna o organization_id do usuario atual de forma segura (bypassa RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_my_organization_id IS 'Retorna o organization_id do usuario atual, bypassa RLS';

-- 2. RLS POLICIES PARA financial_transactions
-- ============================================================================

-- Habilitar RLS se nao estiver habilitado
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view org transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can insert org transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can update org transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can delete org transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Super admins full access transactions" ON public.financial_transactions;

-- SELECT: usuarios veem apenas transacoes da sua organizacao
CREATE POLICY "Users can view org transactions"
ON public.financial_transactions FOR SELECT
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- INSERT: usuarios podem inserir apenas na sua organizacao
CREATE POLICY "Users can insert org transactions"
ON public.financial_transactions FOR INSERT
WITH CHECK (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- UPDATE: usuarios podem atualizar apenas transacoes da sua organizacao
CREATE POLICY "Users can update org transactions"
ON public.financial_transactions FOR UPDATE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- DELETE: usuarios podem deletar apenas transacoes da sua organizacao
CREATE POLICY "Users can delete org transactions"
ON public.financial_transactions FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- 3. RLS POLICIES PARA inventory_items
-- ============================================================================

-- Habilitar RLS se nao estiver habilitado
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update org inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete org inventory" ON public.inventory_items;

-- SELECT: usuarios veem apenas itens da sua organizacao
CREATE POLICY "Users can view org inventory"
ON public.inventory_items FOR SELECT
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- INSERT: usuarios podem inserir apenas na sua organizacao
CREATE POLICY "Users can insert org inventory"
ON public.inventory_items FOR INSERT
WITH CHECK (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- UPDATE: usuarios podem atualizar apenas itens da sua organizacao
CREATE POLICY "Users can update org inventory"
ON public.inventory_items FOR UPDATE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- DELETE: usuarios podem deletar apenas itens da sua organizacao
CREATE POLICY "Users can delete org inventory"
ON public.inventory_items FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- 4. RLS POLICIES PARA tables_rooms
-- ============================================================================

-- Habilitar RLS se nao estiver habilitado
ALTER TABLE public.tables_rooms ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view org tables_rooms" ON public.tables_rooms;
DROP POLICY IF EXISTS "Users can insert org tables_rooms" ON public.tables_rooms;
DROP POLICY IF EXISTS "Users can update org tables_rooms" ON public.tables_rooms;
DROP POLICY IF EXISTS "Users can delete org tables_rooms" ON public.tables_rooms;

-- SELECT: usuarios veem apenas mesas/quartos da sua organizacao
CREATE POLICY "Users can view org tables_rooms"
ON public.tables_rooms FOR SELECT
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- INSERT: usuarios podem inserir apenas na sua organizacao
CREATE POLICY "Users can insert org tables_rooms"
ON public.tables_rooms FOR INSERT
WITH CHECK (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- UPDATE: usuarios podem atualizar apenas mesas/quartos da sua organizacao
CREATE POLICY "Users can update org tables_rooms"
ON public.tables_rooms FOR UPDATE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- DELETE: usuarios podem deletar apenas mesas/quartos da sua organizacao
CREATE POLICY "Users can delete org tables_rooms"
ON public.tables_rooms FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- 5. RLS POLICIES PARA reservations (completar DELETE)
-- ============================================================================

-- Habilitar RLS se nao estiver habilitado
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Remover policy de delete se existir e recriar
DROP POLICY IF EXISTS "Users can delete org reservations" ON public.reservations;

-- DELETE: usuarios podem deletar apenas reservas da sua organizacao
CREATE POLICY "Users can delete org reservations"
ON public.reservations FOR DELETE
USING (
  organization_id = public.get_my_organization_id()
  OR public.is_super_admin()
);

-- Verificar se outras policies existem, senao criar
DROP POLICY IF EXISTS "Users can view org reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can insert org reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update org reservations" ON public.reservations;

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

-- 6. FUNCAO admin_create_user
-- Permite que admins criem usuarios diretamente (sem convite por email)
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

  -- Criar usuario no auth.users usando a extensao pgcrypto
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

COMMENT ON FUNCTION public.admin_create_user IS 'Permite que admins criem usuarios diretamente com senha, sem convite por email';

-- 7. CAMPOS AVANCADOS PARA QUARTOS
-- Adicionar colunas andar, descricao e preco_base na tabela tables_rooms
-- ============================================================================

-- Verificar e adicionar coluna andar se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables_rooms' AND column_name = 'andar'
  ) THEN
    ALTER TABLE public.tables_rooms ADD COLUMN andar INTEGER;
  END IF;
END $$;

-- Verificar e adicionar coluna descricao se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables_rooms' AND column_name = 'descricao'
  ) THEN
    ALTER TABLE public.tables_rooms ADD COLUMN descricao TEXT;
  END IF;
END $$;

-- Verificar e adicionar coluna preco_base se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables_rooms' AND column_name = 'preco_base'
  ) THEN
    ALTER TABLE public.tables_rooms ADD COLUMN preco_base DECIMAL(10,2);
  END IF;
END $$;

-- Comentarios nas colunas novas
COMMENT ON COLUMN public.tables_rooms.andar IS 'Numero do andar onde o quarto esta localizado';
COMMENT ON COLUMN public.tables_rooms.descricao IS 'Descricao detalhada do quarto (amenidades, vista, etc)';
COMMENT ON COLUMN public.tables_rooms.preco_base IS 'Preco base da diaria do quarto';

-- 8. ADICIONAR funcao admin_create_user ao tipo Functions do Supabase
-- ============================================================================

-- Garantir que a funcao pode ser chamada via RPC
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_organization_id TO authenticated;

-- ============================================================================
-- FIM DA MIGRACAO
-- ============================================================================
