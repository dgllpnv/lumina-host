-- Enum para tipos de role
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'staff');

-- Enum para tipos de organização
CREATE TYPE public.organization_type AS ENUM ('restaurante', 'pousada');

-- Enum para tipos de transação
CREATE TYPE public.transaction_type AS ENUM ('receita', 'despesa');

-- Enum para status de transação
CREATE TYPE public.transaction_status AS ENUM ('pendente', 'pago', 'cancelado', 'atrasado');

-- Enum para status de mesa/quarto
CREATE TYPE public.table_room_status AS ENUM ('livre', 'ocupado', 'sujo', 'reservado');

-- Tabela de organizações (empresas clientes)
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo organization_type NOT NULL DEFAULT 'restaurante',
  plano TEXT DEFAULT 'basic',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'staff',
  nome TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de transações financeiras
CREATE TABLE public.financial_transactions (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de estoque
CREATE TABLE public.inventory_items (
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
CREATE TABLE public.tables_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'mesa',
  capacidade INTEGER DEFAULT 4,
  status table_room_status NOT NULL DEFAULT 'livre',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de roles (segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para obter organization_id do usuário
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

-- RLS Policies para organizations
CREATE POLICY "Super admins can view all organizations" 
ON public.organizations FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage organizations" 
ON public.organizations FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own organization" 
ON public.organizations FOR SELECT 
USING (id = public.get_user_organization_id(auth.uid()));

-- RLS Policies para profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Allow insert for new users" 
ON public.profiles FOR INSERT 
WITH CHECK (id = auth.uid());

-- RLS Policies para financial_transactions
CREATE POLICY "Users can view transactions in their org" 
ON public.financial_transactions FOR SELECT 
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage transactions in their org" 
ON public.financial_transactions FOR ALL 
USING (
  organization_id = public.get_user_organization_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Super admins can view all transactions" 
ON public.financial_transactions FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies para inventory_items
CREATE POLICY "Users can view inventory in their org" 
ON public.inventory_items FOR SELECT 
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage inventory in their org" 
ON public.inventory_items FOR ALL 
USING (
  organization_id = public.get_user_organization_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- RLS Policies para tables_rooms
CREATE POLICY "Users can view tables/rooms in their org" 
ON public.tables_rooms FOR SELECT 
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update tables/rooms status in their org" 
ON public.tables_rooms FOR UPDATE 
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage tables/rooms in their org" 
ON public.tables_rooms FOR ALL 
USING (
  organization_id = public.get_user_organization_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- RLS Policies para user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'nome', new.email)
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tables_rooms_updated_at
  BEFORE UPDATE ON public.tables_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();