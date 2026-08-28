import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  data: string;
  categoria: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  loading?: boolean;
}

export function RecentTransactions({ transactions = [], loading = false }: RecentTransactionsProps) {
  return (
    <div className="animate-in fade-in duration-500 bg-card rounded-2xl p-6 border border-border shadow-soft">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Últimas Transações
        </h3>
        <p className="text-sm text-muted-foreground">Movimentações recentes</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma transação encontrada</p>
          <p className="text-sm mt-1">As transações aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    transaction.tipo === "receita"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {transaction.tipo === "receita" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {transaction.descricao}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.categoria} • {transaction.data}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  transaction.tipo === "receita"
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {transaction.tipo === "receita" ? "+" : "-"} R${" "}
                {transaction.valor.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
