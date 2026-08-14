import api from './api';

export interface Transaction {
  id: string;
  organizationId: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string | null;
  valor: number;
  status: 'pendente' | 'pago' | 'cancelado' | 'atrasado';
  metodoPagto: string | null;
  dataVencimento: string | null;
  dataPagamento: string | null;
  reservationId: string | null;
  reservation?: {
    id: string;
    guestName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao?: string;
  valor: number;
  status?: 'pendente' | 'pago' | 'cancelado' | 'atrasado';
  metodoPagto?: string;
  dataVencimento?: string;
  dataPagamento?: string;
  reservationId?: string;
}

export interface UpdateTransactionData {
  tipo?: 'receita' | 'despesa';
  categoria?: string;
  descricao?: string;
  valor?: number;
  status?: 'pendente' | 'pago' | 'cancelado' | 'atrasado';
  metodoPagto?: string;
  dataVencimento?: string;
  dataPagamento?: string;
}

export interface TransactionFilters {
  tipo?: 'receita' | 'despesa';
  status?: string;
  categoria?: string;
  reservationId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export const transactionsService = {
  async list(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PaginatedResponse<Transaction>>(`/transactions?${params}`);
    return response.data;
  },

  async get(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  async create(data: CreateTransactionData): Promise<Transaction> {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
  },

  async update(id: string, data: UpdateTransactionData): Promise<Transaction> {
    const response = await api.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },
};

export default transactionsService;
