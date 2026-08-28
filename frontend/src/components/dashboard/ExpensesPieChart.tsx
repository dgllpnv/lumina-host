import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface ExpensesPieChartProps {
  data?: ExpenseCategory[];
  loading?: boolean;
}

const defaultData: ExpenseCategory[] = [
  { name: "Sem dados", value: 1, color: "hsl(var(--muted))" },
];

export function ExpensesPieChart({ data = defaultData, loading = false }: ExpensesPieChartProps) {
  const chartData = data.length > 0 ? data : defaultData;

  return (
    <div className="animate-in fade-in duration-500 bg-card rounded-2xl p-6 border border-border shadow-soft">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Despesas por Categoria
        </h3>
        <p className="text-sm text-muted-foreground">Distribuição mensal</p>
      </div>

      <div className="h-[340px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="46%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              />
              <Legend
                verticalAlign="bottom"
                height={48}
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
