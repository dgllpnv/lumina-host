-- ============================================================================
-- FIX COMPLETO DE AUTH E RBAC - EXECUTE ESTE SQL INTEIRO NO SUPABASE
-- Data: 2026-01-16
-- COPIE TUDO E COLE NO SQL EDITOR DO SUPABASE
-- ============================================================================

-- =====================
-- PARTE 1: FUNÇÕES RPC
-- =====================

-- Função para obter a role do usuário atual (BYPASSA RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Primeiro tenta user_roles
  SELECT role::text INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Se não encontrou, tenta profiles
  IF v_role IS NULL THEN
    SELECT role::text INTO v_role
    FROM profiles
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(v_role, 'staff');
END;
$$;

-- Função para obter perfil completo (BYPASSA RLS)
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
  -- Buscar role da tabela user_roles
  SELECT role::text INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Buscar dados do profile
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

-- Função para verificar se é super_admin (BYPASSA RLS)
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

-- Função has_role atualizada (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Função para promover a super_admin
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir ou atualizar user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO UPDATE SET role = 'super_admin';

  -- Remover role staff se existir
  DELETE FROM user_roles
  WHERE user_id = target_user_id AND role = 'staff';

  -- Atualizar profiles também
  UPDATE profiles SET role = 'super_admin' WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Função para configurar usuário de teste
CREATE OR REPLACE FUNCTION public.setup_test_user(
  target_user_id UUID,
  target_role text,
  target_org_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar roles existentes
  DELETE FROM user_roles WHERE user_id = target_user_id;

  -- Inserir nova role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, target_role::app_role);

  -- Atualizar profile
  UPDATE profiles
  SET role = target_role::app_role,
      organization_id = target_org_id
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', target_role,
    'organization_id', target_org_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Função para verificar se sistema foi inicializado
CREATE OR REPLACE FUNCTION public.check_system_initialized()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_roles WHERE role = 'super_admin';
  RETURN jsonb_build_object('initialized', v_count > 0, 'super_admin_count', v_count);
END;
$$;

-- =====================
-- PARTE 2: RLS POLICIES
-- =====================

-- Dropar policies antigas de organizations
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can delete organizations" ON public.organizations;

-- Novas policies para organizations
CREATE POLICY "organizations_select" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "organizations_insert" ON public.organizations FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE USING (public.is_super_admin());
CREATE POLICY "organizations_delete" ON public.organizations FOR DELETE USING (public.is_super_admin());

-- Dropar policies antigas de user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

-- Novas policies para user_roles
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_roles_all_super" ON public.user_roles FOR ALL USING (public.is_super_admin());

-- Dropar policies antigas de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;

-- Novas policies para profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_super" ON public.profiles FOR SELECT USING (public.is_super_admin());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_super" ON public.profiles FOR UPDATE USING (public.is_super_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);

-- =====================
-- PARTE 3: TRIGGER
-- =====================

-- Trigger para criar perfil e role automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', split_part(NEW.email, '@', 1)),
    'staff'::app_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, profiles.nome);

  -- Insert default staff role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- PARTE 4: FIX DIRETO DOS USUÁRIOS EXISTENTES
-- =====================

-- Corrigir o super@lumina.com para ser super_admin
DO $$
DECLARE
  v_super_id UUID;
BEGIN
  -- Encontrar o ID do super@lumina.com
  SELECT id INTO v_super_id FROM auth.users WHERE email = 'super@lumina.com';

  IF v_super_id IS NOT NULL THEN
    -- Deletar role antiga
    DELETE FROM user_roles WHERE user_id = v_super_id;

    -- Inserir role super_admin
    INSERT INTO user_roles (user_id, role) VALUES (v_super_id, 'super_admin');

    -- Atualizar profile
    UPDATE profiles SET role = 'super_admin' WHERE id = v_super_id;

    RAISE NOTICE 'super@lumina.com promovido a super_admin (ID: %)', v_super_id;
  ELSE
    RAISE NOTICE 'Usuário super@lumina.com não encontrado';
  END IF;
END;
$$;

-- Corrigir admin@restaurante.com se existir
DO $$
DECLARE
  v_admin_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@restaurante.com';

  IF v_admin_id IS NOT NULL THEN
    -- Buscar ou criar organização
    SELECT id INTO v_org_id FROM organizations WHERE nome = 'Restaurante Sabor & Arte' LIMIT 1;

    IF v_org_id IS NULL THEN
      INSERT INTO organizations (nome, tipo, plano, ativo)
      VALUES ('Restaurante Sabor & Arte', 'restaurante', 'premium', true)
      RETURNING id INTO v_org_id;
    END IF;

    -- Configurar role
    DELETE FROM user_roles WHERE user_id = v_admin_id;
    INSERT INTO user_roles (user_id, role) VALUES (v_admin_id, 'admin');
    UPDATE profiles SET role = 'admin', organization_id = v_org_id WHERE id = v_admin_id;

    RAISE NOTICE 'admin@restaurante.com configurado como admin (ID: %, Org: %)', v_admin_id, v_org_id;
  END IF;
END;
$$;

-- Corrigir staff@restaurante.com se existir
DO $$
DECLARE
  v_staff_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_staff_id FROM auth.users WHERE email = 'staff@restaurante.com';

  IF v_staff_id IS NOT NULL THEN
    -- Buscar organização
    SELECT id INTO v_org_id FROM organizations WHERE nome = 'Restaurante Sabor & Arte' LIMIT 1;

    -- Configurar role
    DELETE FROM user_roles WHERE user_id = v_staff_id;
    INSERT INTO user_roles (user_id, role) VALUES (v_staff_id, 'staff');
    UPDATE profiles SET role = 'staff', organization_id = v_org_id WHERE id = v_staff_id;

    RAISE NOTICE 'staff@restaurante.com configurado como staff (ID: %, Org: %)', v_staff_id, v_org_id;
  END IF;
END;
$$;

-- =====================
-- PARTE 5: VERIFICAÇÃO
-- =====================

-- Mostrar estado atual dos usuários
SELECT
  p.email,
  p.nome,
  p.role as profile_role,
  ur.role as user_roles_role,
  p.organization_id
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
ORDER BY p.email;

-- Verificar funções criadas
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_my_profile', 'get_my_role', 'is_super_admin', 'promote_to_super_admin', 'setup_test_user');
