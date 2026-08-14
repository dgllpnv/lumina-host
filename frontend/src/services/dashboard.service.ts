import api from './api';

export interface DashboardStats {
  financial: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    netIncome: number;
    pendingPayments: {
      total: number;
      count: number;
    };
    revenueGrowth: number;
    transactionsByCategory: Array<{
      categoria: string;
      tipo: string;
      _sum: { valor: number | null };
      _count: number;
    }>;
  };
  occupancy: {
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    activeReservations: number;
  };
  today: {
    checkins: number;
    checkouts: number;
  };
  inventory: {
    lowStockCount: number;
    lowStockItems: Array<{
      id: string;
      nome: string;
      quantidade: number;
      estoqueMinimo: number | null;
      unidade: string;
    }>;
  };
  recentTransactions: Array<{
    id: string;
    tipo: 'receita' | 'despesa';
    categoria: string;
    descricao: string | null;
    valor: number;
    status: string;
    createdAt: string;
  }>;
}

export interface RevenueChartData {
  date: string;
  receita: number;
  despesa: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  async getRevenueChart(period: number = 30): Promise<RevenueChartData[]> {
    const response = await api.get<RevenueChartData[]>(`/dashboard/revenue-chart?period=${period}`);
    return response.data;
  },
};

export default dashboardService;
