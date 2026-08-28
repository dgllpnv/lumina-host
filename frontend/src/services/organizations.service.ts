import api from './api';

export type OrganizationTipo = 'restaurante' | 'pousada' | 'pousada_restaurante';

export interface Organization {
  id: string;
  nome: string;
  tipo: OrganizationTipo;
  plano: string | null;
  ativo: boolean;
  contractStatus: 'ativo' | 'inativo' | 'inadimplente';
  contractStart: string | null;
  contractEnd: string | null;
  siteSlug: string | null;
  sitePublished: boolean;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    profiles?: number;
    transactions?: number;
    inventory?: number;
  };
}

export interface CreateOrganizationData {
  nome: string;
  tipo?: OrganizationTipo;
  plano?: string;
}

export interface UpdateOrganizationData {
  nome?: string;
  tipo?: OrganizationTipo;
  plano?: string;
  ativo?: boolean;
  contractStatus?: 'ativo' | 'inativo' | 'inadimplente';
  contractStart?: string | null;
  contractEnd?: string | null;
  siteSlug?: string | null;
  sitePublished?: boolean;
  logoUrl?: string | null;
}

export const organizationsService = {
  async list(): Promise<Organization[]> {
    const response = await api.get<Organization[]>('/organizations');
    return response.data;
  },

  async get(id: string): Promise<Organization> {
    const response = await api.get<Organization>(`/organizations/${id}`);
    return response.data;
  },

  async create(data: CreateOrganizationData): Promise<Organization> {
    const response = await api.post<Organization>('/organizations', data);
    return response.data;
  },

  async update(id: string, data: UpdateOrganizationData): Promise<Organization> {
    const response = await api.put<Organization>(`/organizations/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/organizations/${id}`);
  },
};

export default organizationsService;
