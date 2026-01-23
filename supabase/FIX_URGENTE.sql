-- ============================================
-- FIX URGENTE - EXECUTE ESTE SQL COMPLETO
-- Copie TUDO e cole no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR FUNÇÃO get_my_profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
  v_role text;
BEGIN
  SELECT role::text INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', p.id::text,
    'organization_id', p.organization_id::text,
    'role', COALESCE(v_role, p.role::text, 'staff'),
    'nome', p.nome,
    'avatar_url', p.avatar_url,
    'email', p.email
  ) INTO v_profile
  FROM profiles p
  WHERE p.id = auth.uid();

  RETURN v_profile;
END;
$$;

-- 2. CRIAR FUNÇÃO is_super_admin
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

-- 3. CRIAR FUNÇÃO get_my_role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role::text INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_role IS NULL THEN
    SELECT role::text INTO v_role
    FROM profiles
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(v_role, 'staff');
END;
$$;

-- 4. PROMOVER super@lumina.com PARA SUPER_ADMIN
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'super@lumina.com';

  IF v_user_id IS NOT NULL THEN
    -- Deletar roles antigas
    DELETE FROM user_roles WHERE user_id = v_user_id;

    -- Inserir role super_admin
    INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'super_admin');

    -- Atualizar profile
    UPDATE profiles SET role = 'super_admin' WHERE id = v_user_id;

    RAISE NOTICE 'super@lumina.com promovido a super_admin!';
  ELSE
    RAISE NOTICE 'Usuario super@lumina.com nao encontrado';
  END IF;
END;
$$;

-- 5. VERIFICAR RESULTADO
SELECT
  u.email,
  ur.role as role_atual,
  p.role as profile_role
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'super@lumina.com';
