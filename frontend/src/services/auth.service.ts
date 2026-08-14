import api, { tokenStorage, setSelectedOrganization } from './api';

export interface User {
  id: string;
  email: string;
  nome: string | null;
  avatarUrl?: string | null;
  role: 'super_admin' | 'admin' | 'staff';
  organizationId: string | null;
  organization?: {
    id: string;
    nome: string;
    tipo: 'restaurante' | 'pousada';
    plano?: string | null;
    ativo?: boolean;
  } | null;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SystemStatus {
  initialized: boolean;
  superAdminCount: number;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;

    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);

    // Set organization ID for regular users
    if (user.organizationId) {
      setSelectedOrganization(user.organizationId);
    }

    return response.data;
  },

  async register(email: string, password: string, nome?: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', { email, password, nome });
    const { accessToken, refreshToken, user } = response.data;

    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);

    if (user.organizationId) {
      setSelectedOrganization(user.organizationId);
    }

    return response.data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      tokenStorage.clearTokens();
      setSelectedOrganization(null);
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async refresh(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(newRefreshToken);

    return response.data;
  },

  async adminCreateUser(data: {
    email: string;
    password: string;
    nome?: string;
    role?: 'super_admin' | 'admin' | 'staff';
    organizationId?: string;
  }): Promise<{ success: boolean; user: User }> {
    const response = await api.post('/auth/admin-create-user', data);
    return response.data;
  },

  async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get<SystemStatus>('/system/status');
    return response.data;
  },

  async setupSuperAdmin(email: string, password: string, nome?: string): Promise<{ success: boolean; user: User }> {
    const response = await api.post('/system/setup-super-admin', { email, password, nome });
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.getAccessToken();
  },
};

export default authService;
