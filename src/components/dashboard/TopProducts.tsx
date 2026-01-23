import { motion } from "framer-motion";
import { Loader2, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopProduct {
  nome: string;
  quantidade: number;
  valor: number;
}

interface TopProductsProps {
  products?: TopProduct[];
  loading?: boolean;
}

const rankColors = [
  "bg-amber-500 text-white",
  "bg-slate-400 text-white",
  "bg-amber-700 text-white",
  "bg-slate-300 text-slate-700",
  "bg-slate-200 text-slate-600",
];

export function TopProducts({ products = [], loading = false }: TopProductsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-card rounded-2xl p-6 border border-border shadow-soft"
    >
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-amber-500" />
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            TOP 5 Mais Vendidos
          </h3>
          <p className="text-sm text-muted-foreground">Produtos em destaque</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma venda registrada</p>
          <p className="text-sm mt-1">Os produtos mais vendidos aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <motion.div
              key={product.nome}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  rankColors[index] || rankColors[4]
                )}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {product.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.quantidade} {product.quantidade === 1 ? 'venda' : 'vendas'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-success">
                  R$ {product.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
