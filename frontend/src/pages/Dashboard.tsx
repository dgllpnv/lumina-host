import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ExpensesPieChart } from "@/components/dashboard/ExpensesPieChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Hotel,
  Receipt
} from "lucide-react";

export default function Dashboard() {
  const { profile } = useAuth();
  const { kpis, chartData, expensesByCategory, topProducts, recentTransactions, loading } = useDashboardData();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(0)}% em relação a ontem`;
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-[1600px]">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {profile?.nome?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo do seu negócio hoje
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Vendas Hoje"
            value={formatCurrency(kpis.vendasHoje)}
            change={formatChange(kpis.vendasHojeChange)}
            changeType={kpis.vendasHojeChange >= 0 ? "positive" : "negative"}
            icon={DollarSign}
            iconColor="bg-success/10 text-success"
            delay={0}
            loading={loading}
          />
          <KPICard
            title="Receita do Mês"
            value={formatCurrency(kpis.receitaMes)}
            change="Total acumulado"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-primary/10 text-primary"
            delay={0.05}
            loading={loading}
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(kpis.ticketMedio)}
            change="Por venda"
            changeType="neutral"
            icon={Receipt}
            iconColor="bg-indigo-500/10 text-indigo-500"
            delay={0.1}
            loading={loading}
          />
          <KPICard
            title="Contas Atrasadas"
            value={formatCurrency(kpis.contasAtrasadas)}
            change={`${kpis.contasAtrasadasQtd} pendência${kpis.contasAtrasadasQtd !== 1 ? 's' : ''}`}
            changeType={kpis.contasAtrasadasQtd > 0 ? "negative" : "neutral"}
            icon={AlertTriangle}
            iconColor="bg-destructive/10 text-destructive"
            delay={0.15}
            loading={loading}
          />
          <KPICard
            title="Saldo em Caixa"
            value={formatCurrency(kpis.saldoCaixa)}
            change="Atualizado agora"
            changeType={kpis.saldoCaixa >= 0 ? "positive" : "negative"}
            icon={Wallet}
            iconColor="bg-warning/10 text-warning"
            delay={0.2}
            loading={loading}
          />
          <KPICard
            title="Ocupação Hotel"
            value={`${kpis.ocupacaoHotel.toFixed(0)}%`}
            change="Quartos ocupados"
            changeType={kpis.ocupacaoHotel >= 70 ? "positive" : kpis.ocupacaoHotel >= 40 ? "neutral" : "negative"}
            icon={Hotel}
            iconColor="bg-cyan-500/10 text-cyan-500"
            delay={0.25}
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <RevenueChart data={chartData} loading={loading} />
          </div>
          <div>
            <ExpensesPieChart data={expensesByCategory} loading={loading} />
          </div>
        </div>

        {/* Bottom Row - Top Products and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <TopProducts products={topProducts} loading={loading} />
          <RecentTransactions transactions={recentTransactions} loading={loading} />
        </div>
      </div>
    </AppLayout>
  );
}
