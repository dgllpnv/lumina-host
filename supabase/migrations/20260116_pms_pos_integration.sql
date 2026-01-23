-- ============================================================
-- LUMINA HOST - MIGRAÇÃO: INTEGRAÇÃO PMS + POS
-- Sprint 5.1: Conexão Restaurante-Hotel (Postagem em Conta)
-- ============================================================

-- ============================================================
-- PARTE 1: TABELA DE RESERVAS (HOSPEDAGEM)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.tables_rooms(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,

  -- Dados do Hóspede
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_document TEXT,

  -- Datas
  checkin_date TIMESTAMPTZ NOT NULL,
  checkout_date TIMESTAMPTZ NOT NULL,
  actual_checkin TIMESTAMPTZ,
  actual_checkout TIMESTAMPTZ,

  -- Status e Valores
  status TEXT NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado', 'checkin', 'checkout', 'cancelado')),
  daily_rate DECIMAL(10,2) NOT NULL,
  total_stay DECIMAL(10,2),

  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reservations_organization ON public.reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_number);
CREATE INDEX IF NOT EXISTS idx_reservations_guest ON public.reservations(guest_name);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(checkin_date, checkout_date);

-- ============================================================
-- PARTE 2: ADICIONAR COLUNA reservation_id EM financial_transactions
-- ============================================================

-- Adicionar coluna reservation_id (nullable para transações que não são de quarto)
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL;

-- Índice para consultas rápidas de extrato do hóspede
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reservation
ON public.financial_transactions(reservation_id)
WHERE reservation_id IS NOT NULL;

-- ============================================================
-- PARTE 3: RLS PARA RESERVATIONS
-- ============================================================

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Super admin pode tudo
CREATE POLICY "reservations_super_admin" ON public.reservations
  FOR ALL USING (public.is_super_admin());

-- Admin e Staff podem ver/gerenciar reservas da sua organização
CREATE POLICY "reservations_org_select" ON public.reservations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "reservations_org_insert" ON public.reservations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "reservations_org_update" ON public.reservations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- PARTE 4: FUNÇÃO RPC PARA BUSCAR EXTRATO DO HÓSPEDE
-- ============================================================

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

-- ============================================================
-- PARTE 5: FUNÇÃO RPC PARA TOTALIZAR CONTA DO HÓSPEDE
-- ============================================================

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

-- ============================================================
-- PARTE 6: GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_charges TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_total TO authenticated;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

SELECT 'Migração PMS+POS concluída com sucesso!' as status;
