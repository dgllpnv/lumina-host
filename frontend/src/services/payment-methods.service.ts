import api from './api';

export type PaymentMethodTipo = 'pix' | 'cartao' | 'dinheiro' | 'transferencia';

export interface PaymentMethod {
  id: string;
  organizationId: string;
  tipo: PaymentMethodTipo;
  instrucoes: string | null;
  ativo: boolean;
}

export interface UpsertPaymentMethodData {
  tipo: PaymentMethodTipo;
  instrucoes?: string | null;
  ativo?: boolean;
}

export const paymentMethodsService = {
  async list(): Promise<PaymentMethod[]> {
    const response = await api.get<PaymentMethod[]>('/payment-methods');
    return response.data;
  },
  async create(data: UpsertPaymentMethodData): Promise<PaymentMethod> {
    const response = await api.post<PaymentMethod>('/payment-methods', data);
    return response.data;
  },
  async update(id: string, data: Partial<UpsertPaymentMethodData>): Promise<PaymentMethod> {
    const response = await api.put<PaymentMethod>(`/payment-methods/${id}`, data);
    return response.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/payment-methods/${id}`);
  },
};

export default paymentMethodsService;
