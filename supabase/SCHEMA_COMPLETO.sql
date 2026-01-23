-- ============================================================
-- LUMINA HOST - SCHEMA COMPLETO DO ZERO
-- Execute este SQL INTEIRO no Supabase SQL Editor
-- Projeto: hzozuldxgqprcnlpeovt
-- ============================================================

-- ============================================================
-- PARTE 1: TIPOS ENUM
-- ============================================================

-- Tipo para roles do sistema
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo para tipos de organização
DO $$ BEGIN
  CREATE TYPE org_type AS ENUM ('restaurante', 'pousada', 'hotel', 'bar', 'cafe');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo para planos
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('basic', 'premium', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- PARTE 2: TABELAS
-- ============================================================

-- Tabela de organizações (multi-tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo org_type NOT NULL DEFAULT 'restaurante',
  plano plan_type NOT NULL DEFAULT 'basic',
  ativo BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'staff',
  nome TEXT,
  email TEXT,
  avatar_url TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles de usuário (para queries mais eficientes)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================================
-- PARTE 3: FUNÇÕES RPC (SECURITY DEFINER - Bypass RLS)
-- ============================================================

-- Função para obter perfil do usuário atual
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

-- Função para obter role do usuário atual
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

-- Função para verificar se é super_admin
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

-- Função has_role
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
  -- Deletar roles antigas
  DELETE FROM user_roles WHERE user_id = target_user_id;

  -- Inserir role super_admin
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin');

  -- Atualizar profile
  UPDATE profiles SET role = 'super_admin' WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
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

-- ============================================================
-- PARTE 4: TRIGGER PARA NOVOS USUÁRIOS
-- ============================================================

-- Função trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar profile
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

  -- Criar role padrão (staff)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PARTE 5: HABILITAR RLS
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 6: POLÍTICAS RLS
-- ============================================================

-- Organizations: todos podem ver, apenas super_admin pode gerenciar
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete" ON public.organizations;

CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE USING (public.is_super_admin());

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE USING (public.is_super_admin());

-- Profiles: usuário vê o próprio, super_admin vê todos
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_super" ON public.profiles
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_super" ON public.profiles
  FOR UPDATE USING (public.is_super_admin());

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- User Roles: usuário vê o próprio, super_admin gerencia todos
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_all_super" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_all_super" ON public.user_roles
  FOR ALL USING (public.is_super_admin());

-- ============================================================
-- PARTE 7: GRANT PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

-- Listar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_my_profile', 'get_my_role', 'is_super_admin', 'has_role', 'promote_to_super_admin', 'check_system_initialized', 'handle_new_user');

-- Listar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'profiles', 'user_roles');
