import api from './api';

export interface TeamMember {
  id: string;
  email: string;
  nome: string | null;
  role: 'super_admin' | 'admin' | 'staff';
  avatarUrl: string | null;
  organizationId: string | null;
  organization?: {
    id: string;
    nome: string;
  } | null;
  createdAt: string;
}

export interface UpdateTeamMemberData {
  nome?: string;
  role?: 'super_admin' | 'admin' | 'staff';
  organizationId?: string | null;
  password?: string;
}

export const teamService = {
  async list(): Promise<TeamMember[]> {
    const response = await api.get<TeamMember[]>('/team');
    return response.data;
  },

  async get(id: string): Promise<TeamMember> {
    const response = await api.get<TeamMember>(`/team/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateTeamMemberData): Promise<TeamMember> {
    const response = await api.put<TeamMember>(`/team/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/team/${id}`);
  },
};

export default teamService;
