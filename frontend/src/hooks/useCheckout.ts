/**
 * Hook useCheckout - Gerencia transações financeiras com suporte a postagem em conta de hóspede
 * Sprint 5.1: Integração PMS + POS
 */

import { useState } from "react";
import { transactionsService, reservationsService } from "@/services";
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
      const transaction = await transactionsService.create({
        reservationId: roomChargeData?.reservationId || undefined,
        tipo: "receita",
        categoria: "vendas",
        valor: checkoutData.total,
        descricao,
        metodoPagto: metodo,
        status,
        dataPagamento: isRoomCharge ? undefined : new Date().toISOString(),
      });

      return { success: true, transactionId: transaction.id };
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
    try {
      const { data } = await reservationsService.list({ status: "checkin", limit: 100 });
      return [...data].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
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
      const { data } = await transactionsService.list({
        reservationId,
        status: "pendente",
      });
      return [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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
      const pending = await getPendingCharges(reservationId);
      await Promise.all(
        pending.map((charge) =>
          transactionsService.update(charge.id, {
            status: "pago",
            metodoPagto: paymentMethod,
            dataPagamento: new Date().toISOString(),
          })
        )
      );
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
