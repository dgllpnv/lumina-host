-- ============================================================================
-- MIGRAÇÃO: Fix RLS Circular Dependency
-- Data: 2026-01-15
-- Descrição: Corrige o problema de dependência circular nas policies RLS
--            onde has_role() precisa ler user_roles que tem RLS que usa has_role()
-- ============================================================================

-- 1. Função SECURITY DEFINER para obter a role do usuário atual
-- Bypassa RLS completamente - seguro porque só retorna dados do próprio usuário
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Primeiro tenta buscar da tabela user_roles
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Se não encontrou, busca da tabela profiles
  IF user_role IS NULL THEN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid();
  END IF;

  -- Se ainda não tem, retorna 'staff' como padrão
  RETURN COALESCE(user_role, 'staff'::app_role);
END;
$$;

-- 2. Função para obter perfil completo com role (bypassa RLS)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data jsonb;
  user_role app_role;
BEGIN
  -- Buscar role da tabela user_roles
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Buscar dados do profile
  SELECT jsonb_build_object(
    'id', p.id,
    'organization_id', p.organization_id,
    'role', COALESCE(user_role, p.role, 'staff'::app_role),
    'nome', p.nome,
    'avatar_url', p.avatar_url,
    'email', p.email
  ) INTO profile_data
  FROM profiles p
  WHERE p.id = auth.uid();

  RETURN profile_data;
END;
$$;

-- 3. Função para verificar se é super_admin (para uso interno)
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

-- 4. Atualizar has_role para usar SECURITY DEFINER
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

-- 5. DROPAR todas as policies existentes e recriar com nova lógica
-- Organizations
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;

-- Policies para organizations
CREATE POLICY "Anyone can view organizations"
ON public.organizations FOR SELECT
USING (true);  -- Temporariamente permite ver todas

CREATE POLICY "Super admins can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update organizations"
ON public.organizations FOR UPDATE
USING (public.is_super_admin());

CREATE POLICY "Super admins can delete organizations"
ON public.organizations FOR DELETE
USING (public.is_super_admin());

-- User Roles - simplificar policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

-- Permitir usuários verem seu próprio role sem depender de has_role
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Super admins podem gerenciar roles (usando função SECURITY DEFINER)
CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_super_admin());

-- 6. Profiles - simplificar policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "System can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);  -- Trigger handle_new_user usa SECURITY DEFINER

-- Super admins podem atualizar qualquer profile
CREATE POLICY "Super admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_super_admin());

-- 7. Garantir que handle_new_user insere na user_roles
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

-- 8. Função para criar usuário de teste com role específico
CREATE OR REPLACE FUNCTION public.setup_test_user(
  target_user_id UUID,
  target_role app_role,
  target_org_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar ou inserir role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

  -- Remover roles antigas se existirem
  DELETE FROM user_roles
  WHERE user_id = target_user_id AND role != target_role;

  -- Atualizar profile
  UPDATE profiles
  SET
    role = target_role,
    organization_id = target_org_id
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', target_role,
    'organization_id', target_org_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.get_my_role IS 'Retorna a role do usuário atual, bypassa RLS';
COMMENT ON FUNCTION public.get_my_profile IS 'Retorna o perfil completo do usuário atual com role, bypassa RLS';
COMMENT ON FUNCTION public.is_super_admin IS 'Verifica se o usuário atual é super_admin, bypassa RLS';
COMMENT ON FUNCTION public.setup_test_user IS 'Configura um usuário de teste com role e organização específicos';
