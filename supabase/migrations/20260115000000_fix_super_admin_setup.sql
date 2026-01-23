-- ============================================================================
-- MIGRAÇÃO: Fix Super Admin Setup
-- Data: 2026-01-15
-- Descrição: Adiciona função RPC segura para criar o primeiro super admin
--            e corrige policies RLS que bloqueavam o setup inicial
-- ============================================================================

-- Função RPC para promover usuário a super_admin
-- SECURITY DEFINER permite bypassar RLS
-- Só funciona se NÃO existir nenhum super_admin ainda (primeira configuração)
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_super_admin_count INTEGER;
  result jsonb;
BEGIN
  -- Verificar se já existe algum super_admin
  SELECT COUNT(*) INTO existing_super_admin_count
  FROM user_roles
  WHERE role = 'super_admin';

  -- Se já existe super_admin, apenas super_admins podem promover outros
  IF existing_super_admin_count > 0 THEN
    -- Verificar se o usuário atual é super_admin
    IF NOT public.has_role(auth.uid(), 'super_admin') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Apenas super admins podem promover outros usuários',
        'code', 'UNAUTHORIZED'
      );
    END IF;
  END IF;

  -- Verificar se o target_user existe na tabela user_roles
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id) THEN
    -- Se não existe, inserir
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin'::app_role);
  ELSE
    -- Se existe, atualizar
    UPDATE user_roles
    SET role = 'super_admin'::app_role
    WHERE user_id = target_user_id;
  END IF;

  -- Também atualizar a coluna role na tabela profiles para consistência
  UPDATE profiles
  SET role = 'super_admin'::app_role
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuário promovido a super_admin com sucesso',
    'user_id', target_user_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- Função para verificar se o sistema já foi configurado (tem super_admin)
CREATE OR REPLACE FUNCTION public.check_system_initialized()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO super_admin_count
  FROM user_roles
  WHERE role = 'super_admin';

  RETURN jsonb_build_object(
    'initialized', super_admin_count > 0,
    'super_admin_count', super_admin_count
  );
END;
$$;

-- Adicionar policy para permitir que novos usuários vejam se são super_admin
-- (necessário para o redirect correto após login)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Garantir que o trigger de criação de usuário funcione corretamente
-- Re-criar para garantir que está atualizado
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

  -- Insert default staff role (can be upgraded later)
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

-- Comentários para documentação
COMMENT ON FUNCTION public.promote_to_super_admin IS 'Promove um usuário a super_admin. Na primeira execução (sem super_admins), qualquer usuário pode usar. Depois, apenas super_admins podem promover outros.';
COMMENT ON FUNCTION public.check_system_initialized IS 'Verifica se o sistema já foi inicializado (se existe pelo menos um super_admin).';
