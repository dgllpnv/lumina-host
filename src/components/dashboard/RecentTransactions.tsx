import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card rounded-2xl p-6 border border-border shadow-soft"
    >
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
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
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
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
