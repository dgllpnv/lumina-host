import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";

interface ChartDataPoint {
  name: string;
  entradas: number;
  saidas: number;
}

interface RevenueChartProps {
  data?: ChartDataPoint[];
  loading?: boolean;
}

const defaultData: ChartDataPoint[] = [
  { name: "01/01", entradas: 0, saidas: 0 },
  { name: "02/01", entradas: 0, saidas: 0 },
  { name: "03/01", entradas: 0, saidas: 0 },
  { name: "04/01", entradas: 0, saidas: 0 },
  { name: "05/01", entradas: 0, saidas: 0 },
  { name: "06/01", entradas: 0, saidas: 0 },
  { name: "07/01", entradas: 0, saidas: 0 },
];

export function RevenueChart({ data = defaultData, loading = false }: RevenueChartProps) {
  const chartData = data.length > 0 ? data : defaultData;

  return (
    <div className="animate-in fade-in duration-500 bg-card rounded-2xl p-6 border border-border shadow-soft">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Fluxo de Caixa
        </h3>
        <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
      </div>

      <div className="h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => value >= 1000 ? `R$${(value / 1000).toFixed(1)}k` : `R$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--success))", strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
