import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCheckout, type RoomChargeData } from "@/hooks/useCheckout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  UtensilsCrossed,
  Search,
  ChefHat,
  X,
  Check,
  Loader2,
  Receipt,
  Clock,
  Building2,
  User,
  Sparkles,
  AlertCircle,
  Bed,
  KeyRound,
  Send,
  Timer,
  MessageSquare,
  ClipboardList,
  ArrowRightLeft,
  Split,
  MoveRight,
  FileText,
  TrendingUp,
  Wallet,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Produtos do cardápio
const products = [
  { id: 1, nome: "Filet Mignon ao Molho", descricao: "Com risoto de funghi", preco: 89.90, categoria: "Principais", imagem: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80" },
  { id: 2, nome: "Risoto de Camarão", descricao: "Camarões frescos, açafrão", preco: 72.90, categoria: "Principais", imagem: "https://images.unsplash.com/photo-1633964913295-ceb43826a07f?w=400&q=80" },
  { id: 3, nome: "Salmão Grelhado", descricao: "Com legumes da estação", preco: 78.90, categoria: "Principais", imagem: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80" },
  { id: 4, nome: "Pasta Truffle", descricao: "Tagliatelle com trufas negras", preco: 68.90, categoria: "Massas", imagem: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80" },
  { id: 5, nome: "Carpaccio de Wagyu", descricao: "Com rúcula e parmesão", preco: 58.90, categoria: "Entradas", imagem: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80" },
  { id: 6, nome: "Vinho Tinto Premium", descricao: "Taça de reserva especial", preco: 45.90, categoria: "Bebidas", imagem: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
  { id: 7, nome: "Coquetel Signature", descricao: "Gin, limão siciliano, ervas", preco: 38.90, categoria: "Bebidas", imagem: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
  { id: 8, nome: "Tiramisù Artesanal", descricao: "Receita tradicional italiana", preco: 32.90, categoria: "Sobremesas", imagem: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80" },
  { id: 9, nome: "Petit Gâteau", descricao: "Com sorvete de baunilha", preco: 28.90, categoria: "Sobremesas", imagem: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80" },
  { id: 10, nome: "Água San Pellegrino", descricao: "750ml com gás", preco: 18.90, categoria: "Bebidas", imagem: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&q=80" },
  { id: 11, nome: "Tartar de Atum", descricao: "Com abacate e gergelim", preco: 62.90, categoria: "Entradas", imagem: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80" },
  { id: 12, nome: "Gnocchi alla Sorrentina", descricao: "Molho de tomate e mozzarella", preco: 52.90, categoria: "Massas", imagem: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80" },
];

const categories = ["Todos", "Entradas", "Principais", "Massas", "Sobremesas", "Bebidas"];

type TableStatus = "livre" | "ocupado" | "aguardando" | "pedido_em_preparo";

interface Table {
  id: number;
  nome: string;
  status: TableStatus;
  cliente?: string;
}

interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
}

interface Sale {
  id: number;
  mesa: string;
  cliente: string;
  itens: CartItem[];
  total: number;
  formaPagamento: string;
  horario: string;
}

// KDS Lite - Pedidos em preparo
interface KitchenOrder {
  id: number;
  mesa: string;
  cliente: string;
  itens: CartItem[];
  total: number;
  horarioEnvio: Date;
  status: "pendente" | "em_preparo" | "pronto";
}

type PaymentMethod = "pix" | "cartao" | "dinheiro" | "conta_hospede" | null;

interface OccupiedRoom {
  id: string;
  room_number: string;
  room_type: string;
  guest_name: string;
  checkin_date: string;
  checkout_date: string;
}

export default function POSRestaurante() {
  const { activeOrganization } = useOrganization();
  const { isProcessing, processCheckout, getOccupiedRooms } = useCheckout();

  // Estados principais
  const [tables, setTables] = useState<Table[]>([
    { id: 1, nome: "Mesa 1", status: "livre" },
    { id: 2, nome: "Mesa 2", status: "ocupado", cliente: "João Silva" },
    { id: 3, nome: "Mesa 3", status: "livre" },
    { id: 4, nome: "Mesa 4", status: "ocupado", cliente: "Maria Santos" },
    { id: 5, nome: "Mesa 5", status: "aguardando" },
    { id: 6, nome: "Mesa 6", status: "livre" },
    { id: 7, nome: "Mesa 7", status: "livre" },
    { id: 8, nome: "Mesa 8", status: "livre" },
  ]);

  // Carrinho por mesa - cada mesa tem seu próprio carrinho persistente
  const [tableOrders, setTableOrders] = useState<Record<number, CartItem[]>>({});
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  // Carrinho atual é derivado da mesa selecionada
  const cart = selectedTable ? (tableOrders[selectedTable] || []) : [];

  // Função para atualizar o carrinho da mesa atual
  const setCart = (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    if (!selectedTable) return;
    setTableOrders(prev => {
      const currentCart = prev[selectedTable] || [];
      const newCart = typeof updater === 'function' ? updater(currentCart) : updater;
      return { ...prev, [selectedTable]: newCart };
    });
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Estados para modais
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [paymentStep, setPaymentStep] = useState<"select" | "process" | "complete">("select");
  const [clientName, setClientName] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [cardBrand, setCardBrand] = useState<string | null>(null);

  // Estados para lançamento em quarto (Hotel)
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<OccupiedRoom | null>(null);
  const [guestConfirmed, setGuestConfirmed] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Vendas do dia
  const [salesToday, setSalesToday] = useState<Sale[]>([]);

  // KDS Lite - Pedidos na cozinha
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [showKitchenSheet, setShowKitchenSheet] = useState(false);
  const [, setTimerTick] = useState(0);

  // Transferência de mesa e divisão de itens
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [transferTargetTable, setTransferTargetTable] = useState<number | null>(null);
  const [splitSelectedItems, setSplitSelectedItems] = useState<Set<number>>(new Set());

  // KDS Lite: Atualizar timer a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: typeof products[0]) => {
    if (!selectedTable) {
      toast.error("Selecione uma mesa primeiro");
      return;
    }

    const table = tables.find(t => t.id === selectedTable);
    if (table?.status === "livre") {
      setShowClientModal(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prev, { ...product, quantidade: 1 }];
    });

    toast.success(`${product.nome} adicionado`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => item.id === id ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item)
        .filter((item) => item.quantidade > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const troco = valorRecebido ? Math.max(0, parseFloat(valorRecebido) - total) : 0;

  // Alterar status da mesa
  const cycleTableStatus = (tableId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;

      const statusCycle: Record<TableStatus, TableStatus> = {
        "livre": "ocupado",
        "ocupado": "aguardando",
        "aguardando": "livre"
      };

      const newStatus = statusCycle[table.status];
      if (newStatus === "livre") {
        return { ...table, status: newStatus, cliente: undefined };
      }
      return { ...table, status: newStatus };
    }));
  };

  // Abrir mesa com cliente
  const openTableWithClient = () => {
    if (!clientName.trim()) {
      toast.error("Digite o nome do cliente");
      return;
    }

    setTables(prev => prev.map(table =>
      table.id === selectedTable
        ? { ...table, status: "ocupado" as TableStatus, cliente: clientName }
        : table
    ));

    setShowClientModal(false);
    setClientName("");
    toast.success(`Mesa aberta para ${clientName}`);
  };

  // KDS Lite: Atualizar observação do item
  const updateItemObservacao = (itemId: number, observacao: string) => {
    setCart(prev => prev.map(item =>
      item.id === itemId ? { ...item, observacao } : item
    ));
  };

  // KDS Lite: Enviar pedido para cozinha
  const handleSendToKitchen = () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido");
      return;
    }

    const table = tables.find(t => t.id === selectedTable);
    if (!table) {
      toast.error("Selecione uma mesa");
      return;
    }

    // Criar pedido para cozinha
    const newOrder: KitchenOrder = {
      id: Date.now(),
      mesa: table.nome,
      cliente: table.cliente || "Cliente",
      itens: [...cart],
      total,
      horarioEnvio: new Date(),
      status: "pendente"
    };

    setKitchenOrders(prev => [newOrder, ...prev]);

    // Atualizar status da mesa para "em preparo"
    setTables(prev => prev.map(t =>
      t.id === selectedTable
        ? { ...t, status: "pedido_em_preparo" as TableStatus }
        : t
    ));

    // Limpar carrinho da mesa específica (itens foram enviados para cozinha)
    if (selectedTable) {
      setTableOrders(prev => {
        const newOrders = { ...prev };
        delete newOrders[selectedTable];
        return newOrders;
      });
    }
    toast.success(`Pedido enviado para cozinha - ${table.nome}`);
  };

  // KDS Lite: Marcar pedido como pronto
  const markOrderReady = (orderId: number) => {
    setKitchenOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: "pronto" } : order
    ));
    toast.success("Pedido marcado como pronto!");
  };

  // KDS Lite: Atualizar status do pedido
  const updateOrderStatus = (orderId: number, status: KitchenOrder["status"]) => {
    setKitchenOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status } : order
    ));
  };

  // KDS Lite: Calcular tempo decorrido
  const getElapsedTime = (startTime: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Transferência de mesa: Transferir todo o pedido para outra mesa
  const handleTransferTable = () => {
    if (!selectedTable || !transferTargetTable) {
      toast.error("Selecione uma mesa de destino");
      return;
    }

    const sourceTable = tables.find(t => t.id === selectedTable);
    const targetTable = tables.find(t => t.id === transferTargetTable);

    if (!sourceTable || !targetTable) return;

    // Transferir carrinho da mesa origem para a mesa destino
    setTableOrders(prev => {
      const newOrders = { ...prev };
      const sourceCart = newOrders[selectedTable] || [];
      const targetCart = newOrders[transferTargetTable] || [];
      // Mesa destino recebe os itens da origem
      newOrders[transferTargetTable] = [...targetCart, ...sourceCart];
      // Limpar carrinho da mesa origem
      delete newOrders[selectedTable];
      return newOrders;
    });

    // Atualizar mesas
    setTables(prev => prev.map(table => {
      if (table.id === selectedTable) {
        return { ...table, status: "livre" as TableStatus, cliente: undefined };
      }
      if (table.id === transferTargetTable) {
        return { ...table, status: sourceTable.status, cliente: sourceTable.cliente };
      }
      return table;
    }));

    // Transferir pedidos na cozinha
    setKitchenOrders(prev => prev.map(order =>
      order.mesa === sourceTable.nome
        ? { ...order, mesa: targetTable.nome }
        : order
    ));

    setShowTransferModal(false);
    setTransferTargetTable(null);
    setSelectedTable(transferTargetTable);
    toast.success(`Pedido transferido de ${sourceTable.nome} para ${targetTable.nome}`);
  };

  // Divisão de itens: Dividir itens selecionados para outra mesa
  const handleSplitItems = () => {
    if (!selectedTable || !transferTargetTable || splitSelectedItems.size === 0) {
      toast.error("Selecione itens e uma mesa de destino");
      return;
    }

    const sourceTable = tables.find(t => t.id === selectedTable);
    const targetTable = tables.find(t => t.id === transferTargetTable);

    if (!sourceTable || !targetTable) return;

    // Itens que vão para a nova mesa
    const itemsToTransfer = cart.filter(item => splitSelectedItems.has(item.id));
    const itemsToKeep = cart.filter(item => !splitSelectedItems.has(item.id));

    // Atualizar carrinhos de ambas as mesas
    setTableOrders(prev => {
      const newOrders = { ...prev };
      // Carrinho da mesa origem fica apenas com os itens não selecionados
      if (itemsToKeep.length > 0) {
        newOrders[selectedTable] = itemsToKeep;
      } else {
        delete newOrders[selectedTable];
      }
      // Carrinho da mesa destino recebe os itens transferidos
      const existingTargetCart = newOrders[transferTargetTable] || [];
      newOrders[transferTargetTable] = [...existingTargetCart, ...itemsToTransfer];
      return newOrders;
    });

    // Se a mesa destino estiver livre, abrir com os itens
    if (targetTable.status === "livre") {
      setTables(prev => prev.map(table => {
        if (table.id === transferTargetTable) {
          return {
            ...table,
            status: "ocupado" as TableStatus,
            cliente: `Divisão de ${sourceTable.nome}`
          };
        }
        return table;
      }));
    }

    // Fechar modal e resetar
    setShowSplitModal(false);
    setTransferTargetTable(null);
    setSplitSelectedItems(new Set());

    toast.success(`${itemsToTransfer.length} itens transferidos para ${targetTable.nome}`);
  };

  // Toggle item para divisão
  const toggleSplitItem = (itemId: number) => {
    setSplitSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Iniciar finalização
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
    setPaymentStep("select");
    setPaymentMethod(null);
    setValorRecebido("");
    setCardBrand(null);
    setSelectedRoom(null);
    setGuestConfirmed(false);
    setOccupiedRooms([]);
  };

  // Selecionar método de pagamento
  const selectPaymentMethod = async (method: PaymentMethod) => {
    setPaymentMethod(method);

    // Se escolheu lançar em quarto, buscar quartos ocupados
    if (method === "conta_hospede") {
      setLoadingRooms(true);
      try {
        const rooms = await getOccupiedRooms();
        setOccupiedRooms(
          rooms.map((r) => ({
            id: r.id,
            room_number: r.roomNumber,
            room_type: r.roomType,
            guest_name: r.guestName,
            checkin_date: r.checkinDate,
            checkout_date: r.checkoutDate,
          }))
        );
      } catch (error) {
        console.error("Erro ao buscar quartos:", error);
        toast.error("Erro ao buscar quartos ocupados");
      } finally {
        setLoadingRooms(false);
      }
    }

    setPaymentStep("process");
  };

  // Confirmar pagamento
  const confirmPayment = async () => {
    if (paymentMethod === "dinheiro" && parseFloat(valorRecebido) < total) {
      toast.error("Valor insuficiente");
      return;
    }

    // Validação para lançamento em quarto
    if (paymentMethod === "conta_hospede") {
      if (!selectedRoom) {
        toast.error("Selecione um quarto");
        return;
      }
      if (!guestConfirmed) {
        toast.error("Confirme que o hóspede autorizou o lançamento");
        return;
      }
    }

    setPaymentStep("complete");

    // Processar via hook (integração com o backend)
    const table = tables.find(t => t.id === selectedTable);
    const checkoutData = {
      items: cart,
      total,
      mesa: table?.nome,
      cliente: table?.cliente,
    };

    let roomChargeData: RoomChargeData | undefined;
    if (paymentMethod === "conta_hospede" && selectedRoom) {
      roomChargeData = {
        reservationId: selectedRoom.id,
        roomNumber: selectedRoom.room_number,
        guestName: selectedRoom.guest_name,
      };
    }

    // Registrar transação (se houver organização ativa)
    if (activeOrganization?.id) {
      const result = await processCheckout(
        checkoutData,
        paymentMethod as "pix" | "cartao" | "dinheiro" | "conta_hospede",
        roomChargeData
      );

      if (!result.success) {
        console.error("Erro ao registrar transação:", result.error);
      }
    }

    // Definir forma de pagamento para o registro local
    let formaPagamento = "Dinheiro";
    if (paymentMethod === "pix") formaPagamento = "PIX";
    else if (paymentMethod === "cartao") formaPagamento = `Cartão ${cardBrand}`;
    else if (paymentMethod === "conta_hospede" && selectedRoom) {
      formaPagamento = `Quarto ${selectedRoom.room_number}`;
    }

    // Registrar venda localmente
    const newSale: Sale = {
      id: Date.now(),
      mesa: table?.nome || "Mesa ?",
      cliente: paymentMethod === "conta_hospede" && selectedRoom
        ? selectedRoom.guest_name
        : (table?.cliente || "Cliente"),
      itens: [...cart],
      total,
      formaPagamento,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setSalesToday(prev => [newSale, ...prev]);

    // Limpar após 2 segundos
    setTimeout(() => {
      // Limpar carrinho da mesa específica
      if (selectedTable) {
        setTableOrders(prev => {
          const newOrders = { ...prev };
          delete newOrders[selectedTable];
          return newOrders;
        });
      }
      setTables(prev => prev.map(table =>
        table.id === selectedTable
          ? { ...table, status: "aguardando" as TableStatus, cliente: undefined }
          : table
      ));
      setSelectedTable(null);
      setShowPaymentModal(false);

      if (paymentMethod === "conta_hospede" && selectedRoom) {
        toast.success(`Lançamento realizado com sucesso no Quarto ${selectedRoom.room_number}`);
      } else {
        toast.success("Venda finalizada com sucesso!");
      }
    }, 2000);
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "livre": return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "ocupado": return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
      case "aguardando": return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case "pedido_em_preparo": return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case "livre": return "Livre";
      case "ocupado": return "Ocupado";
      case "aguardando": return "Limpeza";
      case "pedido_em_preparo": return "Preparo";
    }
  };

  const totalVendasHoje = salesToday.reduce((acc, sale) => acc + sale.total, 0);

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Header da Unidade */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-between shadow-lg shadow-indigo-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-indigo-100 text-xs font-medium">Unidade Ativa</p>
              <h2 className="text-white font-semibold text-lg font-serif">
                {activeOrganization?.nome || "Carregando..."}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* KDS Lite: Pedidos Pendentes */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-orange-500/80 hover:bg-orange-500 text-white border-0">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Cozinha
                  {kitchenOrders.filter(o => o.status !== "pronto").length > 0 && (
                    <Badge className="ml-2 bg-white text-orange-600">
                      {kitchenOrders.filter(o => o.status !== "pronto").length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-orange-600" />
                    Pedidos Pendentes
                  </SheetTitle>
                  <SheetDescription>
                    Acompanhe os pedidos enviados para a cozinha
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {kitchenOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum pedido na cozinha</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-200px)]">
                      <div className="space-y-4 pr-3">
                        {kitchenOrders.map(order => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all",
                              order.status === "pronto"
                                ? "bg-emerald-50 border-emerald-300"
                                : order.status === "em_preparo"
                                ? "bg-orange-50 border-orange-300"
                                : "bg-amber-50 border-amber-300"
                            )}
                          >
                            {/* Header do pedido */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge className={cn(
                                  order.status === "pronto"
                                    ? "bg-emerald-500"
                                    : order.status === "em_preparo"
                                    ? "bg-orange-500"
                                    : "bg-amber-500"
                                )}>
                                  {order.mesa}
                                </Badge>
                                <span className="text-sm font-medium text-slate-700">{order.cliente}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500">
                                <Timer className="w-4 h-4" />
                                <span className="text-sm font-mono">
                                  {getElapsedTime(order.horarioEnvio)}
                                </span>
                              </div>
                            </div>

                            {/* Itens do pedido */}
                            <div className="space-y-2 mb-3">
                              {order.itens.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-900">
                                      {item.quantidade}x {item.nome}
                                    </span>
                                  </div>
                                  {item.observacao && (
                                    <p className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                                      <MessageSquare className="w-3 h-3" />
                                      {item.observacao}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2">
                              {order.status === "pendente" && (
                                <Button
                                  size="sm"
                                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                                  onClick={() => updateOrderStatus(order.id, "em_preparo")}
                                >
                                  <ChefHat className="w-4 h-4 mr-1" />
                                  Iniciar Preparo
                                </Button>
                              )}
                              {order.status === "em_preparo" && (
                                <Button
                                  size="sm"
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() => markOrderReady(order.id)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Marcar Pronto
                                </Button>
                              )}
                              {order.status === "pronto" && (
                                <Badge className="bg-emerald-100 text-emerald-700 w-full justify-center py-2">
                                  <Check className="w-4 h-4 mr-1" />
                                  Pronto para Servir
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Drawer Vendas de Hoje */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  <Receipt className="w-4 h-4 mr-2" />
                  Vendas de Hoje
                  {salesToday.length > 0 && (
                    <Badge className="ml-2 bg-amber-400 text-amber-900">{salesToday.length}</Badge>
                  )}
                </Button>
              </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  Vendas de Hoje
                </SheetTitle>
                <SheetDescription>
                  Resumo das vendas finalizadas na sua sessão
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6">
                {/* Resumo Principal */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total do Dia</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        R$ {totalVendasHoje.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Vendas</p>
                      <p className="text-2xl font-bold text-slate-900">{salesToday.length}</p>
                    </div>
                  </div>
                </div>

                {/* Relatório de Turno */}
                {salesToday.length > 0 && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-semibold text-slate-900 text-sm">Relatório de Turno</h4>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <TrendingUp className="w-3 h-3" />
                          Ticket Médio
                        </div>
                        <p className="text-lg font-bold text-slate-900">
                          R$ {(totalVendasHoje / salesToday.length).toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Wallet className="w-3 h-3" />
                          Itens Vendidos
                        </div>
                        <p className="text-lg font-bold text-slate-900">
                          {salesToday.reduce((acc, s) => acc + s.itens.reduce((a, i) => a + i.quantidade, 0), 0)}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown por Forma de Pagamento */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Por Forma de Pagamento</p>
                      {(() => {
                        const paymentBreakdown: Record<string, { count: number; total: number }> = {};
                        salesToday.forEach(sale => {
                          if (!paymentBreakdown[sale.formaPagamento]) {
                            paymentBreakdown[sale.formaPagamento] = { count: 0, total: 0 };
                          }
                          paymentBreakdown[sale.formaPagamento].count++;
                          paymentBreakdown[sale.formaPagamento].total += sale.total;
                        });
                        return Object.entries(paymentBreakdown).map(([method, data]) => (
                          <div key={method} className="flex items-center justify-between p-2 bg-white rounded-lg text-sm">
                            <div className="flex items-center gap-2">
                              {method === "PIX" && <QrCode className="w-4 h-4 text-violet-600" />}
                              {method.includes("Cartão") && <CreditCard className="w-4 h-4 text-blue-600" />}
                              {method === "Dinheiro" && <Banknote className="w-4 h-4 text-emerald-600" />}
                              {method.includes("Quarto") && <Bed className="w-4 h-4 text-amber-600" />}
                              <span className="text-slate-700">{method}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5">{data.count}</Badge>
                            </div>
                            <span className="font-semibold text-slate-900">R$ {data.total.toFixed(2)}</span>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Botão Fechar Turno */}
                    <Button
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        const report = {
                          data: new Date().toLocaleDateString('pt-BR'),
                          totalVendas: salesToday.length,
                          valorTotal: totalVendasHoje,
                          ticketMedio: totalVendasHoje / salesToday.length,
                        };
                        console.log("Relatório de Fechamento:", report);
                        toast.success("Turno fechado! Relatório gerado.");
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Fechar Turno e Gerar Relatório
                    </Button>
                  </div>
                )}

                {/* Lista de vendas */}
                <div className="space-y-3 max-h-[calc(100vh-500px)] overflow-auto">
                  {salesToday.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma venda ainda</p>
                    </div>
                  ) : (
                    salesToday.map(sale => (
                      <div key={sale.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{sale.mesa}</Badge>
                            <span className="text-sm text-slate-600">{sale.cliente}</span>
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sale.horario}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          {sale.itens.map(item => `${item.quantidade}x ${item.nome}`).join(", ")}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-slate-200 text-slate-700">{sale.formaPagamento}</Badge>
                          <span className="font-bold text-indigo-600">R$ {sale.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Left Side - Products & Tables */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Tables Selector */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Mapa de Mesas</h3>
                  <span className="text-xs text-slate-400">(clique duplo para alterar status)</span>
                </div>
                {/* Botões de transferência e divisão */}
                {selectedTable && ["ocupado", "pedido_em_preparo"].includes(tables.find(t => t.id === selectedTable)?.status || "") && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => setShowTransferModal(true)}
                    >
                      <ArrowRightLeft className="w-3 h-3 mr-1" />
                      Transferir Mesa
                    </Button>
                    {cart.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-violet-200 text-violet-600 hover:bg-violet-50"
                        onClick={() => {
                          setSplitSelectedItems(new Set());
                          setShowSplitModal(true);
                        }}
                      >
                        <Split className="w-3 h-3 mr-1" />
                        Dividir Conta
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {tables.map((table) => {
                  const tableCart = tableOrders[table.id] || [];
                  const hasItems = tableCart.length > 0;
                  const itemCount = tableCart.reduce((acc, item) => acc + item.quantidade, 0);

                  return (
                    <Button
                      key={table.id}
                      variant="outline"
                      className={cn(
                        "h-20 flex-col gap-1 relative transition-all",
                        selectedTable === table.id && "ring-2 ring-indigo-500 ring-offset-2",
                        getStatusColor(table.status)
                      )}
                      onClick={() => setSelectedTable(table.id)}
                      onDoubleClick={(e) => cycleTableStatus(table.id, e)}
                    >
                      {table.cliente && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap max-w-[80px] truncate">
                          {table.cliente}
                        </div>
                      )}
                      {/* Indicador de itens no carrinho */}
                      {hasItems && (
                        <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg">
                          {itemCount}
                        </div>
                      )}
                      <span className="text-xs font-semibold">{table.nome}</span>
                      <span className="text-[10px] opacity-70">{getStatusLabel(table.status)}</span>
                    </Button>
                  );
                })}
              </div>
            </motion.div>

            {/* Products Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-auto shadow-sm"
            >
              {/* Search & Categories */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar no cardápio..."
                    className="pl-9 bg-slate-50 border-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="bg-slate-100 h-10">
                    {categories.map(cat => (
                      <TabsTrigger key={cat} value={cat} className="text-xs px-3">{cat}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900">Cardápio</h3>
                <span className="text-sm text-slate-400">({filteredProducts.length} itens)</span>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden group bg-white border-slate-100"
                        onClick={() => addToCart(product)}
                      >
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img
                            src={product.imagem}
                            alt={product.nome}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <Badge className="absolute top-2 right-2 text-[10px] bg-white/90 text-slate-700 backdrop-blur-sm border-0">
                            {product.categoria}
                          </Badge>
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white font-semibold text-sm line-clamp-1 drop-shadow-lg">{product.nome}</p>
                            <p className="text-white/80 text-xs line-clamp-1">{product.descricao}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-slate-50 to-white">
                          <div className="flex items-center justify-between">
                            <p className="text-indigo-600 font-bold text-lg">R$ {product.preco.toFixed(2)}</p>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-indigo-50">
                              <Plus className="w-4 h-4 text-indigo-600" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <ChefHat className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Nenhum item encontrado</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Side - Cart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-lg"
          >
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
              <h3 className="text-lg font-semibold text-slate-900">
                Pedido {selectedTable ? `- Mesa ${selectedTable}` : ""}
              </h3>
              <p className="text-sm text-slate-500">
                {cart.length} {cart.length === 1 ? "item" : "itens"}
                {selectedTable && tables.find(t => t.id === selectedTable)?.cliente && (
                  <span className="ml-2 text-indigo-600">
                    • {tables.find(t => t.id === selectedTable)?.cliente}
                  </span>
                )}
              </p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 p-4 overflow-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  <UtensilsCrossed className="w-12 h-12 mb-3 text-slate-200" />
                  <p>Selecione uma mesa e adicione produtos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{item.nome}</p>
                            <p className="text-xs text-slate-500">R$ {item.preco.toFixed(2)} cada</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-7 w-7 border-slate-200" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-semibold text-slate-900">{item.quantidade}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7 border-slate-200" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {/* KDS Lite: Campo de observação */}
                        <div className="mt-2 flex items-center gap-2">
                          <MessageSquare className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <Input
                            placeholder="Observações (ex: sem cebola, mal passado)"
                            value={item.observacao || ""}
                            onChange={(e) => updateItemObservacao(item.id, e.target.value)}
                            className="h-7 text-xs bg-white border-slate-200"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t border-slate-100 space-y-4 bg-gradient-to-r from-slate-50 to-white rounded-b-2xl">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-slate-700">Total</span>
                <span className="text-indigo-600">R$ {total.toFixed(2)}</span>
              </div>

              {/* KDS Lite: Botões de ação */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 font-semibold"
                  disabled={cart.length === 0}
                  onClick={handleSendToKitchen}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar p/ Cozinha
                </Button>
                <Button
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 font-semibold"
                  disabled={cart.length === 0}
                  onClick={handleFinalizeSale}
                >
                  Finalizar Venda
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal Nome do Cliente */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Abrir Mesa
            </DialogTitle>
            <DialogDescription>
              Digite o nome do cliente para abrir a mesa {selectedTable}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                placeholder="Ex: João Silva"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && openTableWithClient()}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowClientModal(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={openTableWithClient}>
                Abrir Mesa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Finalizar Pagamento
            </DialogTitle>
            <DialogDescription>
              Total: <span className="font-bold text-indigo-600">R$ {total.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              {/* Seleção de método */}
              {paymentStep === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                  <Card
                    className="p-4 cursor-pointer hover:shadow-lg hover:border-violet-300 transition-all text-center group"
                    onClick={() => selectPaymentMethod("pix")}
                  >
                    <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                      <QrCode className="w-7 h-7 text-violet-600" />
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">PIX</p>
                    <p className="text-xs text-slate-500">Instantâneo</p>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all text-center group"
                    onClick={() => selectPaymentMethod("cartao")}
                  >
                    <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <CreditCard className="w-7 h-7 text-blue-600" />
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">Cartão</p>
                    <p className="text-xs text-slate-500">Débito/Crédito</p>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-lg hover:border-emerald-300 transition-all text-center group"
                    onClick={() => selectPaymentMethod("dinheiro")}
                  >
                    <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <Banknote className="w-7 h-7 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">Dinheiro</p>
                    <p className="text-xs text-slate-500">Com troco</p>
                  </Card>

                  <Card
                    className="p-4 cursor-pointer hover:shadow-lg hover:border-amber-300 transition-all text-center group"
                    onClick={() => selectPaymentMethod("conta_hospede")}
                  >
                    <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <Bed className="w-7 h-7 text-amber-600" />
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">Hospedagem</p>
                    <p className="text-xs text-slate-500">Lançar no quarto</p>
                  </Card>
                </motion.div>
              )}

              {/* Processo PIX */}
              {paymentStep === "process" && paymentMethod === "pix" && (
                <motion.div
                  key="pix"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <div className="w-48 h-48 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center p-4">
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                      <div className="text-center">
                        <QrCode className="w-16 h-16 mx-auto text-violet-600 mb-2" />
                        <p className="text-xs text-slate-500">QR Code PIX</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4">Escaneie o QR Code ou aguarde a confirmação</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setPaymentStep("select")}>
                      Voltar
                    </Button>
                    <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={confirmPayment}>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Recebimento
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Processo Cartão */}
              {paymentStep === "process" && paymentMethod === "cartao" && (
                <motion.div
                  key="cartao"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <div className="w-32 h-32 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-16 h-16 text-blue-600 animate-pulse" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 mb-2">Aguardando Maquininha...</p>
                  <p className="text-slate-500 mb-4">Passe o cartão na maquininha</p>

                  <div className="flex justify-center gap-3 mb-6">
                    {["Visa", "Master", "Elo"].map(brand => (
                      <Button
                        key={brand}
                        variant={cardBrand === brand ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCardBrand(brand)}
                        className={cardBrand === brand ? "bg-blue-600" : ""}
                      >
                        {brand}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setPaymentStep("select")}>
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={confirmPayment}
                      disabled={!cardBrand}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Pagamento
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Processo Dinheiro */}
              {paymentStep === "process" && paymentMethod === "dinheiro" && (
                <motion.div
                  key="dinheiro"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-4 bg-emerald-50 rounded-xl mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-600">Total a Pagar</span>
                      <span className="text-2xl font-bold text-emerald-600">R$ {total.toFixed(2)}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="valorRecebido">Valor Recebido</Label>
                        <Input
                          id="valorRecebido"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={valorRecebido}
                          onChange={(e) => setValorRecebido(e.target.value)}
                          className="text-lg font-semibold mt-1"
                          autoFocus
                        />
                      </div>

                      {valorRecebido && parseFloat(valorRecebido) >= total && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-3 bg-white rounded-lg border-2 border-emerald-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 flex items-center gap-2">
                              <Banknote className="w-4 h-4" />
                              Troco
                            </span>
                            <span className="text-2xl font-bold text-emerald-600">
                              R$ {troco.toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {valorRecebido && parseFloat(valorRecebido) < total && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Valor insuficiente</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setPaymentStep("select")}>
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={confirmPayment}
                      disabled={!valorRecebido || parseFloat(valorRecebido) < total}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Processo Lançar na Hospedagem */}
              {paymentStep === "process" && paymentMethod === "conta_hospede" && (
                <motion.div
                  key="conta_hospede"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Bed className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Lançar na Hospedagem</p>
                      <p className="text-xs text-amber-600">Valor: R$ {total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Lista de Quartos Ocupados */}
                  {loadingRooms ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-8 h-8 mx-auto text-amber-600 animate-spin mb-3" />
                      <p className="text-slate-500">Buscando quartos ocupados...</p>
                    </div>
                  ) : occupiedRooms.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bed className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">Nenhum quarto ocupado</p>
                      <p className="text-xs text-slate-400 mt-1">Não há hóspedes com check-in ativo</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 mb-3">Selecione o quarto do hóspede:</p>
                      <ScrollArea className="h-48 pr-3">
                        <div className="space-y-2">
                          {occupiedRooms.map((room) => (
                            <Card
                              key={room.id}
                              className={cn(
                                "p-3 cursor-pointer transition-all hover:shadow-md",
                                selectedRoom?.id === room.id
                                  ? "border-2 border-amber-500 bg-amber-50"
                                  : "border border-slate-200 hover:border-amber-300"
                              )}
                              onClick={() => setSelectedRoom(room)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg",
                                  selectedRoom?.id === room.id
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-100 text-slate-700"
                                )}>
                                  {room.room_number}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{room.guest_name}</p>
                                  <p className="text-xs text-slate-500">{room.room_type}</p>
                                </div>
                                {selectedRoom?.id === room.id && (
                                  <Check className="w-5 h-5 text-amber-600" />
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Confirmação do hóspede */}
                      {selectedRoom && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <KeyRound className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                Lançar R$ {total.toFixed(2)} na conta de:
                              </p>
                              <p className="text-amber-600 font-semibold">
                                {selectedRoom.guest_name} - Quarto {selectedRoom.room_number}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200">
                            <Checkbox
                              id="guest-confirm"
                              checked={guestConfirmed}
                              onCheckedChange={(checked) => setGuestConfirmed(checked === true)}
                            />
                            <label
                              htmlFor="guest-confirm"
                              className="text-sm font-medium text-slate-700 cursor-pointer"
                            >
                              Hóspede autorizou o lançamento
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* Botões */}
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setPaymentStep("select")}>
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                      onClick={confirmPayment}
                      disabled={!selectedRoom || !guestConfirmed || isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Confirmar Lançamento
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Confirmação */}
              {paymentStep === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h3>
                  <p className="text-slate-500">Venda finalizada com sucesso</p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Fechando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Transferência de Mesa */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              Transferir Mesa
            </DialogTitle>
            <DialogDescription>
              Transferir todo o pedido da Mesa {selectedTable} para outra mesa
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-slate-600 mb-3">Selecione a mesa de destino:</p>
            <div className="grid grid-cols-4 gap-2">
              {tables.filter(t => t.id !== selectedTable && t.status === "livre").map(table => (
                <Button
                  key={table.id}
                  variant="outline"
                  className={cn(
                    "h-16 flex-col gap-1",
                    transferTargetTable === table.id && "ring-2 ring-blue-500 bg-blue-50"
                  )}
                  onClick={() => setTransferTargetTable(table.id)}
                >
                  <span className="text-xs font-semibold">{table.nome}</span>
                  <span className="text-[10px] text-emerald-600">Livre</span>
                </Button>
              ))}
            </div>
            {tables.filter(t => t.id !== selectedTable && t.status === "livre").length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma mesa livre disponível</p>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowTransferModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleTransferTable}
                disabled={!transferTargetTable}
              >
                <MoveRight className="w-4 h-4 mr-2" />
                Transferir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Divisão de Conta */}
      <Dialog open={showSplitModal} onOpenChange={setShowSplitModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Split className="w-5 h-5 text-violet-600" />
              Dividir Conta
            </DialogTitle>
            <DialogDescription>
              Selecione os itens para transferir para outra mesa
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {/* Lista de itens para selecionar */}
            <p className="text-sm text-slate-600 mb-2">Selecione os itens:</p>
            <ScrollArea className="h-48 border rounded-xl p-3 mb-4">
              <div className="space-y-2">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      splitSelectedItems.has(item.id)
                        ? "bg-violet-50 border-violet-300"
                        : "bg-slate-50 border-slate-200 hover:border-violet-200"
                    )}
                    onClick={() => toggleSplitItem(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={splitSelectedItems.has(item.id)}
                          onCheckedChange={() => toggleSplitItem(item.id)}
                        />
                        <div>
                          <p className="text-sm font-medium">{item.quantidade}x {item.nome}</p>
                          <p className="text-xs text-slate-500">R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Mesa de destino */}
            <p className="text-sm text-slate-600 mb-2">Mesa de destino:</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {tables.filter(t => t.id !== selectedTable).map(table => (
                <Button
                  key={table.id}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-12 flex-col gap-0.5",
                    transferTargetTable === table.id && "ring-2 ring-violet-500 bg-violet-50",
                    getStatusColor(table.status)
                  )}
                  onClick={() => setTransferTargetTable(table.id)}
                >
                  <span className="text-xs font-semibold">{table.nome}</span>
                  <span className="text-[9px]">{getStatusLabel(table.status)}</span>
                </Button>
              ))}
            </div>

            {/* Resumo */}
            {splitSelectedItems.size > 0 && (
              <div className="p-3 bg-violet-50 rounded-xl mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Itens selecionados:</span>
                  <span className="font-semibold text-violet-600">{splitSelectedItems.size}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-600">Valor a transferir:</span>
                  <span className="font-semibold text-violet-600">
                    R$ {cart.filter(i => splitSelectedItems.has(i.id)).reduce((acc, i) => acc + i.preco * i.quantidade, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSplitModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleSplitItems}
                disabled={splitSelectedItems.size === 0 || !transferTargetTable}
              >
                <Split className="w-4 h-4 mr-2" />
                Dividir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
