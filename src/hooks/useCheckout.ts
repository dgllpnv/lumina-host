/**
 * Hook useCheckout - Gerencia transações financeiras com suporte a postagem em conta de hóspede
 * Sprint 5.1: Integração PMS + POS
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
}

export interface CheckoutData {
  items: CartItem[];
  total: number;
  mesa?: string;
  cliente?: string;
}

export interface RoomChargeData {
  reservationId: string;
  roomNumber: string;
  guestName: string;
}

export type PaymentMethod = "pix" | "cartao" | "dinheiro" | "conta_hospede";

interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export function useCheckout() {
  const { activeOrganization } = useOrganization();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Processa o checkout com diferentes métodos de pagamento
   */
  const processCheckout = async (
    checkoutData: CheckoutData,
    paymentMethod: PaymentMethod,
    roomChargeData?: RoomChargeData
  ): Promise<TransactionResult> => {
    if (!activeOrganization?.id) {
      return { success: false, error: "Organização não encontrada" };
    }

    setIsProcessing(true);

    try {
      // Montar descrição baseada no contexto
      let descricao = "";
      if (roomChargeData) {
        descricao = `Consumo Restaurante - Quarto ${roomChargeData.roomNumber}`;
        if (checkoutData.mesa) {
          descricao += ` (Mesa ${checkoutData.mesa})`;
        }
      } else {
        descricao = checkoutData.mesa
          ? `Venda Mesa ${checkoutData.mesa}`
          : "Venda Balcão";
        if (checkoutData.cliente) {
          descricao += ` - ${checkoutData.cliente}`;
        }
      }

      // Adicionar detalhes dos itens
      const itemsDetail = checkoutData.items
        .map((i) => `${i.quantidade}x ${i.nome}`)
        .join(", ");
      descricao += ` | ${itemsDetail}`;

      // Definir status e método baseado no tipo de pagamento
      const isRoomCharge = paymentMethod === "conta_hospede" && roomChargeData;
      const status = isRoomCharge ? "pendente" : "pago";
      const metodo = isRoomCharge ? "conta_hospede" : paymentMethod;

      // Criar transação financeira
      const { data, error } = await supabase
        .from("financial_transactions")
        .insert({
          organization_id: activeOrganization.id,
          reservation_id: roomChargeData?.reservationId || null,
          tipo: "receita",
          categoria: "vendas",
          valor: checkoutData.total,
          descricao,
          metodo_pagto: metodo,
          status,
          data_pagamento: isRoomCharge ? null : new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;

      return { success: true, transactionId: data.id };
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Busca quartos ocupados para lançamento em conta
   * Retorna reservas com status = 'checkin' (hóspedes ativos)
   */
  const getOccupiedRooms = async () => {
    console.log("[useCheckout] Buscando quartos ocupados...");
    console.log("[useCheckout] Organization ID:", activeOrganization?.id);

    try {
      // Query base: buscar reservas com check-in ativo
      let query = supabase
        .from("reservations")
        .select("id, room_number, room_type, guest_name, checkin_date, checkout_date")
        .eq("status", "checkin")
        .order("room_number");

      // Filtrar por organização se disponível
      if (activeOrganization?.id) {
        query = query.eq("organization_id", activeOrganization.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[useCheckout] Erro na query:", error);
        throw error;
      }

      console.log("[useCheckout] Quartos ocupados encontrados:", data);
      console.log("[useCheckout] Total de quartos:", data?.length || 0);

      return data || [];
    } catch (error) {
      console.error("[useCheckout] Erro ao buscar quartos ocupados:", error);
      return [];
    }
  };

  /**
   * Busca lançamentos pendentes de uma reserva (para checkout do hotel)
   */
  const getPendingCharges = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("id, descricao, valor, categoria, created_at, metodo_pagto")
        .eq("reservation_id", reservationId)
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar lançamentos pendentes:", error);
      return [];
    }
  };

  /**
   * Totaliza lançamentos pendentes de uma reserva
   */
  const getPendingTotal = async (reservationId: string) => {
    const charges = await getPendingCharges(reservationId);
    return charges.reduce((acc, charge) => acc + (charge.valor || 0), 0);
  };

  /**
   * Marca lançamentos como pagos no checkout do hotel
   */
  const settleCharges = async (reservationId: string, paymentMethod: string) => {
    try {
      const { error } = await supabase
        .from("financial_transactions")
        .update({
          status: "pago",
          metodo_pagto: paymentMethod,
          data_pagamento: new Date().toISOString(),
        })
        .eq("reservation_id", reservationId)
        .eq("status", "pendente");

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Erro ao quitar lançamentos:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    isProcessing,
    processCheckout,
    getOccupiedRooms,
    getPendingCharges,
    getPendingTotal,
    settleCharges,
  };
}
