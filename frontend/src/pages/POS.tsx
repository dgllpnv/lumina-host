import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  QrCode,
  UtensilsCrossed,
  Bed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const products = [
  { id: 1, nome: "X-Burger", preco: 28.90, categoria: "Lanches" },
  { id: 2, nome: "Refrigerante 350ml", preco: 6.90, categoria: "Bebidas" },
  { id: 3, nome: "Porção Batata Frita", preco: 22.90, categoria: "Porções" },
  { id: 4, nome: "Suco Natural 500ml", preco: 12.90, categoria: "Bebidas" },
  { id: 5, nome: "Pizza Margherita", preco: 45.90, categoria: "Pizzas" },
  { id: 6, nome: "Cerveja Artesanal", preco: 18.90, categoria: "Bebidas" },
  { id: 7, nome: "Sobremesa do Dia", preco: 15.90, categoria: "Sobremesas" },
  { id: 8, nome: "Água Mineral", preco: 4.90, categoria: "Bebidas" },
];

const tables = [
  { id: 1, nome: "Mesa 1", status: "livre" },
  { id: 2, nome: "Mesa 2", status: "ocupado" },
  { id: 3, nome: "Mesa 3", status: "livre" },
  { id: 4, nome: "Mesa 4", status: "ocupado" },
  { id: 5, nome: "Mesa 5", status: "sujo" },
  { id: 6, nome: "Mesa 6", status: "livre" },
  { id: 7, nome: "Mesa 7", status: "reservado" },
  { id: 8, nome: "Mesa 8", status: "livre" },
];

const rooms = [
  { id: 1, nome: "Quarto 101", status: "livre" },
  { id: 2, nome: "Quarto 102", status: "ocupado" },
  { id: 3, nome: "Quarto 103", status: "ocupado" },
  { id: 4, nome: "Quarto 201", status: "livre" },
  { id: 5, nome: "Quarto 202", status: "sujo" },
  { id: 6, nome: "Quarto 203", status: "reservado" },
];

interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [businessType] = useState<"restaurante" | "pousada">("restaurante");

  const addToCart = (product: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantidade: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "livre":
        return "bg-success/10 text-success border-success/20";
      case "ocupado":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "sujo":
        return "bg-warning/10 text-warning border-warning/20";
      case "reservado":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "";
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
        {/* Left Side - Products & Tables */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Tables/Rooms Selector */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-4"
          >
            <Tabs defaultValue={businessType === "restaurante" ? "mesas" : "quartos"}>
              <TabsList className="mb-4">
                {businessType === "restaurante" ? (
                  <TabsTrigger value="mesas" className="gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Mesas
                  </TabsTrigger>
                ) : (
                  <TabsTrigger value="quartos" className="gap-2">
                    <Bed className="h-4 w-4" />
                    Quartos
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="mesas" className="mt-0">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {tables.map((table) => (
                    <Button
                      key={table.id}
                      variant="outline"
                      className={cn(
                        "h-16 flex-col gap-1",
                        selectedTable === table.id && "ring-2 ring-primary",
                        getStatusColor(table.status)
                      )}
                      onClick={() => setSelectedTable(table.id)}
                    >
                      <span className="text-xs font-medium">{table.nome}</span>
                      <span className="text-[10px] capitalize opacity-70">{table.status}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="quartos" className="mt-0">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {rooms.map((room) => (
                    <Button
                      key={room.id}
                      variant="outline"
                      className={cn(
                        "h-20 flex-col gap-1",
                        selectedTable === room.id && "ring-2 ring-primary",
                        getStatusColor(room.status)
                      )}
                      onClick={() => setSelectedTable(room.id)}
                    >
                      <span className="text-xs font-medium">{room.nome}</span>
                      <span className="text-[10px] capitalize opacity-70">{room.status}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 bg-card rounded-2xl border border-border p-4 overflow-auto"
          >
            <h3 className="text-lg font-semibold mb-4">Produtos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.02 * index }}
                >
                  <Card
                    className="p-4 cursor-pointer hover:shadow-soft hover:border-primary/50 transition-all duration-200 active:scale-95"
                    onClick={() => addToCart(product)}
                  >
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2 text-[10px]">
                        {product.categoria}
                      </Badge>
                      <p className="font-medium text-sm mb-1 line-clamp-2">
                        {product.nome}
                      </p>
                      <p className="text-primary font-bold">
                        R$ {product.preco.toFixed(2)}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Cart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-96 bg-card rounded-2xl border border-border flex flex-col"
        >
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold">
              Pedido {selectedTable ? `- Mesa ${selectedTable}` : ""}
            </h3>
            <p className="text-sm text-muted-foreground">
              {cart.length} {cart.length === 1 ? "item" : "itens"}
            </p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 p-4 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Adicione produtos ao pedido
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {item.preco.toFixed(2)} cada
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantidade}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="flex-col h-16 gap-1">
                <Banknote className="h-5 w-5" />
                <span className="text-[10px]">Dinheiro</span>
              </Button>
              <Button variant="outline" className="flex-col h-16 gap-1">
                <CreditCard className="h-5 w-5" />
                <span className="text-[10px]">Cartão</span>
              </Button>
              <Button variant="outline" className="flex-col h-16 gap-1">
                <QrCode className="h-5 w-5" />
                <span className="text-[10px]">PIX</span>
              </Button>
            </div>

            <Button className="w-full h-12 gradient-primary shadow-glow text-lg font-semibold">
              Finalizar Venda
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
