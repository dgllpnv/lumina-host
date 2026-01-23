import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  "Outros": "hsl(350 89% 60%)",
};

export function useDashboardData(): DashboardData {
  const { profile } = useAuth();
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

  useEffect(() => {
    if (!profile?.organization_id) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const orgId = profile.organization_id;
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        // Fetch all transactions for the organization
        const { data: allTransactions, error: transError } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });

        if (transError) throw transError;

        const transactions = allTransactions || [];

        // Calculate KPIs
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayEnd);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        // Vendas de hoje (receitas pagas hoje)
        const vendasHoje = transactions
          .filter(t =>
            t.tipo === "receita" &&
            t.status === "pago" &&
            new Date(t.data_pagamento || t.created_at) >= todayStart &&
            new Date(t.data_pagamento || t.created_at) <= todayEnd
          )
          .reduce((sum, t) => sum + (t.valor || 0), 0);

        // Vendas de ontem
        const vendasOntem = transactions
          .filter(t =>
            t.tipo === "receita" &&
            t.status === "pago" &&
            new Date(t.data_pagamento || t.created_at) >= yesterdayStart &&
            new Date(t.data_pagamento || t.created_at) <= yesterdayEnd
          )
          .reduce((sum, t) => sum + (t.valor || 0), 0);

        const vendasHojeChange = vendasOntem > 0
          ? ((vendasHoje - vendasOntem) / vendasOntem) * 100
          : vendasHoje > 0 ? 100 : 0;

        // Receita do mês
        const receitaMes = transactions
          .filter(t =>
            t.tipo === "receita" &&
            t.status === "pago" &&
            new Date(t.data_pagamento || t.created_at) >= monthStart &&
            new Date(t.data_pagamento || t.created_at) <= monthEnd
          )
          .reduce((sum, t) => sum + (t.valor || 0), 0);

        // Ticket médio (vendas pagas do mês)
        const vendasMes = transactions.filter(t =>
          t.tipo === "receita" &&
          t.status === "pago" &&
          new Date(t.data_pagamento || t.created_at) >= monthStart &&
          new Date(t.data_pagamento || t.created_at) <= monthEnd
        );
        const ticketMedio = vendasMes.length > 0 ? receitaMes / vendasMes.length : 0;

        // Contas em atraso
        const contasAtrasadas = transactions.filter(t => t.status === "atrasado");
        const contasAtrasadasValor = contasAtrasadas.reduce((sum, t) => sum + (t.valor || 0), 0);

        // Saldo em caixa do mes (receitas pagas - despesas pagas do mes atual)
        const totalReceitasMes = transactions
          .filter(t =>
            t.tipo === "receita" &&
            t.status === "pago" &&
            new Date(t.data_pagamento || t.created_at) >= monthStart &&
            new Date(t.data_pagamento || t.created_at) <= monthEnd
          )
          .reduce((sum, t) => sum + (t.valor || 0), 0);
        const totalDespesasMes = transactions
          .filter(t =>
            t.tipo === "despesa" &&
            t.status === "pago" &&
            new Date(t.data_pagamento || t.created_at) >= monthStart &&
            new Date(t.data_pagamento || t.created_at) <= monthEnd
          )
          .reduce((sum, t) => sum + (t.valor || 0), 0);
        const saldoCaixa = totalReceitasMes - totalDespesasMes;

        // Ocupação do hotel (reservas com checkin ativo)
        const { data: reservations } = await supabase
          .from("reservations")
          .select("*")
          .eq("organization_id", orgId);

        const { data: rooms } = await supabase
          .from("tables_rooms")
          .select("*")
          .eq("organization_id", orgId)
          .eq("tipo", "quarto");

        const checkinAtivos = (reservations || []).filter(r => r.status === "checkin").length;
        const totalQuartos = (rooms || []).length || 1;
        const ocupacaoHotel = (checkinAtivos / totalQuartos) * 100;

        setKpis({
          vendasHoje,
          vendasHojeChange,
          receitaMes,
          ticketMedio,
          contasAtrasadas: contasAtrasadasValor,
          contasAtrasadasQtd: contasAtrasadas.length,
          saldoCaixa,
          ocupacaoHotel,
        });

        // Chart data - últimos 7 dias
        const last7Days: ChartDataPoint[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));

          const dayLabel = dayStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

          const entradas = transactions
            .filter(t =>
              t.tipo === "receita" &&
              t.status === "pago" &&
              new Date(t.data_pagamento || t.created_at) >= dayStart &&
              new Date(t.data_pagamento || t.created_at) <= dayEnd
            )
            .reduce((sum, t) => sum + (t.valor || 0), 0);

          const saidas = transactions
            .filter(t =>
              t.tipo === "despesa" &&
              t.status === "pago" &&
              new Date(t.data_pagamento || t.created_at) >= dayStart &&
              new Date(t.data_pagamento || t.created_at) <= dayEnd
            )
            .reduce((sum, t) => sum + (t.valor || 0), 0);

          last7Days.push({ name: dayLabel, entradas, saidas });
        }
        setChartData(last7Days);

        // Despesas por categoria (mês atual)
        const despesasMes = transactions.filter(t =>
          t.tipo === "despesa" &&
          t.status === "pago" &&
          new Date(t.data_pagamento || t.created_at) >= monthStart &&
          new Date(t.data_pagamento || t.created_at) <= monthEnd
        );

        const categoriaMap: Record<string, number> = {};
        despesasMes.forEach(t => {
          const cat = t.categoria || "Outros";
          categoriaMap[cat] = (categoriaMap[cat] || 0) + (t.valor || 0);
        });

        const expenseCategories: ExpenseCategory[] = Object.entries(categoriaMap)
          .map(([name, value]) => ({
            name,
            value,
            color: CATEGORY_COLORS[name] || CATEGORY_COLORS["Outros"],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setExpensesByCategory(expenseCategories.length > 0 ? expenseCategories : [
          { name: "Sem dados", value: 1, color: "hsl(var(--muted))" }
        ]);

        // TOP 5 produtos - usando categoria "Vendas" como referência
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
        const recent = transactions.slice(0, 10).map(t => {
          const createdAt = new Date(t.created_at);
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
            tipo: t.tipo as "receita" | "despesa",
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
    };

    fetchDashboardData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_transactions',
          filter: `organization_id=eq.${profile.organization_id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.organization_id]);

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
