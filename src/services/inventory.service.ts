import api from './api';

export interface InventoryItem {
  id: string;
  organizationId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  categoria: string | null;
  estoqueMinimo: number | null;
  precoUnitario: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemData {
  nome: string;
  quantidade?: number;
  unidade?: string;
  categoria?: string;
  estoqueMinimo?: number;
  precoUnitario?: number;
}

export interface UpdateInventoryItemData {
  nome?: string;
  quantidade?: number;
  unidade?: string;
  categoria?: string;
  estoqueMinimo?: number;
  precoUnitario?: number;
}

export interface InventoryFilters {
  categoria?: string;
  lowStock?: boolean;
}

export const inventoryService = {
  async list(filters?: InventoryFilters): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.lowStock) params.append('lowStock', 'true');
    }
    const response = await api.get<InventoryItem[]>(`/inventory?${params}`);
    return response.data;
  },

  async get(id: string): Promise<InventoryItem> {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return response.data;
  },

  async create(data: CreateInventoryItemData): Promise<InventoryItem> {
    const response = await api.post<InventoryItem>('/inventory', data);
    return response.data;
  },

  async update(id: string, data: UpdateInventoryItemData): Promise<InventoryItem> {
    const response = await api.put<InventoryItem>(`/inventory/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/inventory/${id}`);
  },

  async adjust(id: string, adjustment: number, reason?: string): Promise<InventoryItem> {
    const response = await api.post<InventoryItem>(`/inventory/${id}/adjust`, { adjustment, reason });
    return response.data;
  },
};

export default inventoryService;
