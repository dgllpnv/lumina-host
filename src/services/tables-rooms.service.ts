import api from './api';

export interface TableRoom {
  id: string;
  organizationId: string;
  nome: string;
  tipo: string;
  status: 'livre' | 'ocupado' | 'sujo' | 'reservado';
  capacidade: number | null;
  andar: number | null;
  descricao: string | null;
  precoBase: number | null;
  createdAt: string;
  updatedAt: string;
  reservations?: any[];
}

export interface CreateTableRoomData {
  nome: string;
  tipo?: string;
  status?: 'livre' | 'ocupado' | 'sujo' | 'reservado';
  capacidade?: number;
  andar?: number;
  descricao?: string;
  precoBase?: number;
}

export interface UpdateTableRoomData {
  nome?: string;
  tipo?: string;
  status?: 'livre' | 'ocupado' | 'sujo' | 'reservado';
  capacidade?: number;
  andar?: number;
  descricao?: string;
  precoBase?: number;
}

export interface TableRoomFilters {
  tipo?: string;
  status?: string;
}

export const tablesRoomsService = {
  async list(filters?: TableRoomFilters): Promise<TableRoom[]> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.status) params.append('status', filters.status);
    }
    const response = await api.get<TableRoom[]>(`/tables-rooms?${params}`);
    return response.data;
  },

  async get(id: string): Promise<TableRoom> {
    const response = await api.get<TableRoom>(`/tables-rooms/${id}`);
    return response.data;
  },

  async create(data: CreateTableRoomData): Promise<TableRoom> {
    const response = await api.post<TableRoom>('/tables-rooms', data);
    return response.data;
  },

  async update(id: string, data: UpdateTableRoomData): Promise<TableRoom> {
    const response = await api.put<TableRoom>(`/tables-rooms/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: 'livre' | 'ocupado' | 'sujo' | 'reservado'): Promise<TableRoom> {
    const response = await api.patch<TableRoom>(`/tables-rooms/${id}/status`, { status });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tables-rooms/${id}`);
  },
};

export default tablesRoomsService;
