import api from './api';

export interface PackageItem {
  id: string;
  organizationId: string;
  nome: string;
  descricao: string | null;
  precoPromocional: number | null;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  ativo: boolean;
}

export interface UpsertPackageData {
  nome: string;
  descricao?: string | null;
  precoPromocional?: number | null;
  vigenciaInicio?: string | null;
  vigenciaFim?: string | null;
  ativo?: boolean;
}

export const packagesService = {
  async list(): Promise<PackageItem[]> {
    const response = await api.get<PackageItem[]>('/packages');
    return response.data;
  },
  async create(data: UpsertPackageData): Promise<PackageItem> {
    const response = await api.post<PackageItem>('/packages', data);
    return response.data;
  },
  async update(id: string, data: Partial<UpsertPackageData>): Promise<PackageItem> {
    const response = await api.put<PackageItem>(`/packages/${id}`, data);
    return response.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/packages/${id}`);
  },
};

export default packagesService;
