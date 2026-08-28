import api from './api';

export type TipTipo = 'passeio' | 'transfer' | 'gastronomia';

export interface Tip {
  id: string;
  organizationId: string;
  tipo: TipTipo;
  titulo: string;
  descricao: string | null;
  fotos: string[];
  ordem: number;
}

export interface UpsertTipData {
  tipo: TipTipo;
  titulo: string;
  descricao?: string | null;
  fotos?: string[];
  ordem?: number;
}

export const tipsService = {
  async list(tipo?: TipTipo): Promise<Tip[]> {
    const response = await api.get<Tip[]>('/tips', { params: tipo ? { tipo } : undefined });
    return response.data;
  },
  async create(data: UpsertTipData): Promise<Tip> {
    const response = await api.post<Tip>('/tips', data);
    return response.data;
  },
  async update(id: string, data: Partial<UpsertTipData>): Promise<Tip> {
    const response = await api.put<Tip>(`/tips/${id}`, data);
    return response.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/tips/${id}`);
  },
};

export default tipsService;
