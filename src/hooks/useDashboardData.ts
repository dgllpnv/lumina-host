import { useState, useEffect, useCallback } from "react";
import { dashboardService, transactionsService, tablesRoomsService, reservationsService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

interface KPIData {
  vendasHoje: number;
  vendasHojeChange: number;
  receitaMes: number;
  ticketMedio: number;
  contasAtrasadas: number;
  contasAtrasadasQtd: number;
  saldoCaixa: number;
  ocupacaoHotel: number;
}

interface ChartDataPoint {
  name: string;
  entradas: number;
  saidas: number;
}

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  nome: string;
  quantidade: number;
  valor: number;
}

interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  data: string;
  categoria: string;
}

interface DashboardData {
  kpis: KPIData;
  chartData: ChartDataPoint[];
  expensesByCategory: ExpenseCategory[];
  topProducts: TopProduct[];
  recentTransactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Insumos": "hsl(239 84% 67%)",
  "Pessoal": "hsl(160 84% 39%)",
  "Manutenção": "hsl(38 92% 50%)",
  "Salários": "hsl(280 84% 60%)",
  "Aluguel": "hsl(200 84% 50%)",
  "hospedagem": "hsl(160 84% 39%)",
  "Vendas": "hsl(239 84% 67%)",
  "Outros": "hsl(350 89% 60%)",
};

export function useDashboardData(): DashboardData {
  const { profile } = useAuth();
  const { activeOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIData>({
    vendasHoje: 0,
    vendasHojeChange: 0,
    receitaMes: 0,
    ticketMedio: 0,
    contasAtrasadas: 0,
    contasAtrasadasQtd: 0,
    saldoCaixa: 0,
    ocupacaoHotel: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategory[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!activeOrganizationId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch dashboard stats from API
      const stats = await dashboardService.getStats();

      // Calculate today's sales and change (simplified - use transactions)
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

      // Get transactions for KPI calculations
      const txResponse = await transactionsService.list({ limit: 1000 });
      const transactions = txResponse.data || [];

      // Vendas de hoje
      const vendasHoje = transactions
        .filter(t =>
          t.tipo === "receita" &&
          t.status === "pago" &&
          new Date(t.dataPagamento || t.createdAt) >= todayStart &&
          new Date(t.dataPagamento || t.createdAt) <= todayEnd
        )
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      // Vendas de ontem
      const vendasOntem = transactions
        .filter(t =>
          t.tipo === "receita" &&
          t.status === "pago" &&
          new Date(t.dataPagamento || t.createdAt) >= yesterdayStart &&
          new Date(t.dataPagamento || t.createdAt) <= yesterdayEnd
        )
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      const vendasHojeChange = vendasOntem > 0
        ? ((vendasHoje - vendasOntem) / vendasOntem) * 100
        : vendasHoje > 0 ? 100 : 0;

      // Ticket médio
      const vendasMes = transactions.filter(t =>
        t.tipo === "receita" && t.status === "pago"
      );
      const ticketMedio = vendasMes.length > 0
        ? stats.financial.monthlyRevenue / vendasMes.length
        : 0;

      setKpis({
        vendasHoje,
        vendasHojeChange,
        receitaMes: stats.financial.monthlyRevenue,
        ticketMedio,
        contasAtrasadas: stats.financial.pendingPayments.total,
        contasAtrasadasQtd: stats.financial.pendingPayments.count,
        saldoCaixa: stats.financial.netIncome,
        ocupacaoHotel: stats.occupancy.occupancyRate,
      });

      // Chart data - últimos 7 dias
      const chartResponse = await dashboardService.getRevenueChart(7);
      const chartPoints: ChartDataPoint[] = chartResponse.map(item => ({
        name: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        entradas: item.receita,
        saidas: item.despesa,
      }));
      setChartData(chartPoints);

      // Despesas por categoria
      const expenseCategories: ExpenseCategory[] = stats.financial.transactionsByCategory
        .filter(item => item.tipo === 'despesa')
        .map(item => ({
          name: item.categoria,
          value: item._sum.valor || 0,
          color: CATEGORY_COLORS[item.categoria] || CATEGORY_COLORS["Outros"],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setExpensesByCategory(expenseCategories.length > 0 ? expenseCategories : [
        { name: "Sem dados", value: 1, color: "hsl(var(--muted))" }
      ]);

      // TOP 5 produtos - grouped by description
      const vendasPorDescricao: Record<string, { quantidade: number; valor: number }> = {};
      transactions
        .filter(t => t.tipo === "receita" && t.status === "pago")
        .forEach(t => {
          const desc = t.descricao || "Venda";
          if (!vendasPorDescricao[desc]) {
            vendasPorDescricao[desc] = { quantidade: 0, valor: 0 };
          }
          vendasPorDescricao[desc].quantidade += 1;
          vendasPorDescricao[desc].valor += t.valor || 0;
        });

      const top5 = Object.entries(vendasPorDescricao)
        .map(([nome, data]) => ({ nome, ...data }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      setTopProducts(top5);

      // Recent transactions
      const recent = stats.recentTransactions.map(t => {
        const createdAt = new Date(t.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let dataStr = "";
        if (diffMins < 60) {
          dataStr = diffMins <= 1 ? "Agora" : `Há ${diffMins} min`;
        } else if (diffHours < 24) {
          dataStr = diffHours === 1 ? "Há 1 hora" : `Há ${diffHours} horas`;
        } else {
          dataStr = diffDays === 1 ? "Há 1 dia" : `Há ${diffDays} dias`;
        }

        return {
          id: t.id,
          descricao: t.descricao || (t.tipo === "receita" ? "Receita" : "Despesa"),
          valor: t.valor,
          tipo: t.tipo,
          data: dataStr,
          categoria: t.categoria,
        };
      });

      setRecentTransactions(recent);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, [activeOrganizationId]);

  useEffect(() => {
    fetchDashboardData();

    // Poll for updates every 30 seconds (replaces realtime)
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    kpis,
    chartData,
    expensesByCategory,
    topProducts,
    recentTransactions,
    loading,
    error,
  };
}
