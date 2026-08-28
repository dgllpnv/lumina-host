import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCheckout } from "@/hooks/useCheckout";
import {
  tablesRoomsService,
  reservationsService,
  type TableRoom,
  type Reservation as ApiReservation,
  type Transaction,
} from "@/services";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bed,
  CalendarDays,
  User,
  Phone,
  Mail,
  Clock,
  Check,
  X,
  Plus,
  Search,
  DoorOpen,
  DoorClosed,
  Sparkles,
  Users,
  CreditCard,
  KeyRound,
  Building2,
  Coffee,
  Wine,
  Loader2,
  AlertCircle,
  Timer,
  UtensilsCrossed,
  Receipt,
  Brush,
  CheckCircle2,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, assetUrl } from "@/lib/utils";
import { toast } from "sonner";

// Foto do quarto vinda do cadastro (Site & Conteúdo); sem foto, mostra um
// placeholder neutro em vez de tentar adivinhar uma imagem de estoque.
function RoomThumb({ foto, nome, className }: { foto?: string; nome: string; className?: string }) {
  if (foto) {
    return <img src={assetUrl(foto)} alt={nome} className={className} />;
  }
  return (
    <div className={cn(className, "flex items-center justify-center bg-slate-200")}>
      <Bed className="w-8 h-8 text-slate-400" />
    </div>
  );
}

// Itens do frigobar
const frigobarItems = [
  { id: 1, nome: "Água Mineral", preco: 8.00 },
  { id: 2, nome: "Refrigerante", preco: 12.00 },
  { id: 3, nome: "Cerveja", preco: 15.00 },
  { id: 4, nome: "Suco Natural", preco: 18.00 },
  { id: 5, nome: "Vinho Tinto", preco: 85.00 },
  { id: 6, nome: "Espumante", preco: 120.00 },
  { id: 7, nome: "Chocolate", preco: 12.00 },
  { id: 8, nome: "Amendoim", preco: 10.00 },
  { id: 9, nome: "Batata Chips", preco: 14.00 },
];

type RoomStatus = TableRoom["status"];

// View local (RoomView) combina o quarto (TableRoom) com a reserva ativa
// ligada a ele (se houver), pra manter o resto do JSX abaixo inalterado.
interface RoomView {
  id: string;
  nome: string;
  tipo: string;
  status: RoomStatus;
  preco: number;
  capacidade: number;
  andar: number;
  foto?: string;
  hospede?: string;
  telefone?: string;
  email?: string;
  checkinDate?: Date;
  checkoutDate?: Date;
  reservationId?: string;
}

// View local da lista de reservas ainda não check-in (status "reservado")
interface ReservationView {
  id: string;
  hospede: string;
  email: string;
  telefone: string;
  quartoId: string;
  quarto: string;
  tipo: string;
  checkin: Date;
  checkout: Date;
  status: "confirmada";
  valor: number;
}

interface FrigobarItem {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
}

const statusConfig = {
  livre: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", icon: DoorOpen, label: "Disponível" },
  ocupado: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700", icon: DoorClosed, label: "Ocupado" },
  sujo: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", icon: Sparkles, label: "Limpeza" },
  reservado: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", icon: CalendarDays, label: "Reservado" }
};

export default function POSHotel() {
  const { activeOrganization } = useOrganization();
  const { getPendingCharges, settleCharges, isProcessing } = useCheckout();

  // Estados principais (dados reais vindos do backend)
  const [rawRooms, setRawRooms] = useState<TableRoom[]>([]);
  const [rawReservations, setRawReservations] = useState<ApiReservation[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [roomsData, reservationsResp] = await Promise.all([
        tablesRoomsService.list({ tipo: "quarto" }),
        reservationsService.list({ limit: 200 }),
      ]);
      setRawRooms(roomsData);
      setRawReservations(
        reservationsResp.data.filter(
          (r) => r.status === "reservado" || r.status === "checkin"
        )
      );
    } catch (error) {
      console.error("[POSHotel] Erro ao carregar dados:", error);
      toast.error("Erro ao carregar quartos e reservas");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Combina cada quarto (TableRoom) com a reserva ativa ligada a ele
  const rooms: RoomView[] = useMemo(
    () =>
      rawRooms.map((r) => {
        const activeRes = rawReservations.find((res) => res.roomId === r.id);
        return {
          id: r.id,
          nome: r.nome,
          tipo: r.tipo,
          status: r.status,
          preco: r.precoBase || 0,
          capacidade: r.capacidade || 0,
          andar: r.andar || 0,
          foto: r.content?.fotos?.[0],
          hospede: activeRes?.guestName,
          telefone: activeRes?.guestPhone || undefined,
          email: activeRes?.guestEmail || undefined,
          checkinDate: activeRes ? new Date(activeRes.checkinDate) : undefined,
          checkoutDate: activeRes ? new Date(activeRes.checkoutDate) : undefined,
          reservationId: activeRes?.id,
        };
      }),
    [rawRooms, rawReservations]
  );

  // Reservas aguardando check-in (aba "Reservas")
  const reservations: ReservationView[] = useMemo(
    () =>
      rawReservations
        .filter((r) => r.status === "reservado")
        .map((r) => ({
          id: r.id,
          hospede: r.guestName,
          email: r.guestEmail || "",
          telefone: r.guestPhone || "",
          quartoId: r.roomId || "",
          quarto: r.roomNumber,
          tipo: r.roomType,
          checkin: new Date(r.checkinDate),
          checkout: new Date(r.checkoutDate),
          status: "confirmada" as const,
          valor: r.totalStay || 0,
        })),
    [rawReservations]
  );

  const [selectedRoom, setSelectedRoom] = useState<RoomView | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [activeTab, setActiveTab] = useState("mapa");

  // Estados do formulário de reserva
  const [reservationForm, setReservationForm] = useState({
    hospede: "",
    telefone: "",
    email: "",
    quartoId: "",
    checkin: "",
    checkout: ""
  });

  // Estados do checkout
  const [checkoutStep, setCheckoutStep] = useState<"frigobar" | "confirm" | "complete">("frigobar");
  const [hasFrigobar, setHasFrigobar] = useState(false);
  const [frigobarCart, setFrigobarCart] = useState<FrigobarItem[]>([]);

  // Estados para lançamentos pendentes (consumo restaurante)
  const [pendingCharges, setPendingCharges] = useState<Transaction[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);

  // Estatísticas
  const stats = {
    total: rooms.length,
    livres: rooms.filter(r => r.status === "livre").length,
    ocupados: rooms.filter(r => r.status === "ocupado").length,
    reservados: rooms.filter(r => r.status === "reservado").length,
    sujos: rooms.filter(r => r.status === "sujo").length,
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.nome.includes(searchTerm) || room.hospede?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || room.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calcular tempo de estadia
  const calculateStayTime = (checkin: Date, checkout: Date) => {
    const now = new Date();
    const totalDays = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
    const remainingMs = checkout.getTime() - now.getTime();
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
      totalDays,
      remainingDays: Math.max(0, remainingDays),
      remainingHours: Math.max(0, remainingHours),
      isOverdue: remainingMs < 0
    };
  };

  const handleRoomClick = (room: RoomView) => {
    setSelectedRoom(room);
    if (room.status === "livre") {
      setReservationForm(prev => ({ ...prev, quartoId: room.id }));
      setShowReservationModal(true);
    } else {
      setShowRoomDetailModal(true);
    }
  };

  // Criar reserva
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservationForm.hospede || !reservationForm.checkin || !reservationForm.checkout || !reservationForm.quartoId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const room = rooms.find(r => r.id === reservationForm.quartoId);
    if (!room) return;

    try {
      await reservationsService.create({
        roomId: room.id,
        guestName: reservationForm.hospede,
        guestEmail: reservationForm.email || undefined,
        guestPhone: reservationForm.telefone || undefined,
        checkinDate: new Date(reservationForm.checkin).toISOString(),
        checkoutDate: new Date(reservationForm.checkout).toISOString(),
        dailyRate: room.preco,
      });

      setShowReservationModal(false);
      setReservationForm({ hospede: "", telefone: "", email: "", quartoId: "", checkin: "", checkout: "" });
      toast.success("Reserva criada com sucesso!");
      await fetchData();
    } catch (error: any) {
      console.error("[Reserva] Erro:", error);
      toast.error("Erro ao criar reserva: " + (error.response?.data?.error || error.message || "Tente novamente"));
    }
  };

  // Realizar check-in
  const handleCheckin = async (reservationId: string, hospedeNome: string) => {
    try {
      await reservationsService.checkIn(reservationId);
      toast.success(`Check-in realizado para ${hospedeNome}!`);
      await fetchData();
    } catch (error: any) {
      console.error("[Check-in] Erro:", error);
      toast.error("Erro ao realizar check-in: " + (error.response?.data?.error || error.message || "Tente novamente"));
    }
  };

  // Iniciar checkout
  const handleStartCheckout = async () => {
    setShowRoomDetailModal(false);
    setCheckoutStep("frigobar");
    setHasFrigobar(false);
    setFrigobarCart([]);
    setPendingCharges([]);
    setShowCheckoutModal(true);

    // Buscar lançamentos pendentes do restaurante ligados à reserva ativa do quarto
    if (selectedRoom?.reservationId) {
      setLoadingCharges(true);
      try {
        const charges = await getPendingCharges(selectedRoom.reservationId);
        setPendingCharges(charges);
      } catch (error) {
        console.error("Erro ao buscar lançamentos:", error);
      } finally {
        setLoadingCharges(false);
      }
    }
  };

  // Adicionar item do frigobar
  const addFrigobarItem = (item: typeof frigobarItems[0]) => {
    setFrigobarCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
  };

  const removeFrigobarItem = (id: number) => {
    setFrigobarCart(prev => prev.filter(i => i.id !== id));
  };

  const totalFrigobar = frigobarCart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const totalPendingCharges = pendingCharges.reduce((acc, charge) => acc + (charge.valor || 0), 0);

  // Calcular total da estadia
  const calculateStayTotal = () => {
    if (!selectedRoom?.checkinDate || !selectedRoom?.checkoutDate) return 0;
    const days = Math.ceil((selectedRoom.checkoutDate.getTime() - selectedRoom.checkinDate.getTime()) / (1000 * 60 * 60 * 24));
    return days * selectedRoom.preco;
  };

  const stayTotal = calculateStayTotal();
  const grandTotal = stayTotal + totalFrigobar + totalPendingCharges;

  // Confirmar checkout
  const confirmCheckout = async () => {
    if (!selectedRoom?.reservationId) {
      setShowCheckoutModal(false);
      return;
    }

    setCheckoutStep("complete");

    try {
      await reservationsService.checkOut(selectedRoom.reservationId, true);
      if (pendingCharges.length > 0) {
        await settleCharges(selectedRoom.reservationId, "conta_hospede");
      }
      await fetchData();

      setTimeout(() => {
        setShowCheckoutModal(false);
        setSelectedRoom(null);
        toast.success("Check-out realizado com sucesso!");
      }, 1500);
    } catch (error: any) {
      console.error("[Checkout] Erro:", error);
      toast.error("Erro ao finalizar check-out: " + (error.response?.data?.error || error.message || "Tente novamente"));
      setCheckoutStep("confirm");
    }
  };

  // Marcar quarto como limpo
  const markRoomClean = async (roomId: string, roomNome: string) => {
    try {
      await tablesRoomsService.updateStatus(roomId, "livre");
      toast.success(`Quarto ${roomNome} marcado como limpo!`);
      setShowRoomDetailModal(false);
      await fetchData();
    } catch (error: any) {
      console.error("[Limpeza] Erro:", error);
      toast.error("Erro ao atualizar quarto");
    }
  };

  // Cancelar reserva
  const handleCancelReservation = async (reservationId: string) => {
    try {
      await reservationsService.cancel(reservationId);
      toast.success("Reserva cancelada");
      await fetchData();
    } catch (error: any) {
      console.error("[Cancelar reserva] Erro:", error);
      toast.error("Erro ao cancelar reserva");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header da Unidade */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-between shadow-lg shadow-blue-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">Unidade Ativa</p>
              <h2 className="text-white font-semibold text-lg font-serif">
                {activeOrganization?.nome || "Carregando..."}
              </h2>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Bed className="h-5 w-5 text-white" />
              </div>
              Gestão de Hospedagem
            </h1>
            <p className="text-slate-500 mt-1">Controle de quartos, reservas e check-in/check-out</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar quarto ou hóspede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 bg-white border-slate-200"
              />
            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
              onClick={() => { setSelectedRoom(null); setShowReservationModal(true); }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Total", value: stats.total, icon: Bed, color: "bg-slate-100 text-slate-600" },
            { label: "Disponíveis", value: stats.livres, icon: DoorOpen, color: "bg-emerald-100 text-emerald-600" },
            { label: "Ocupados", value: stats.ocupados, icon: DoorClosed, color: "bg-red-100 text-red-600" },
            { label: "Reservados", value: stats.reservados, icon: CalendarDays, color: "bg-blue-100 text-blue-600" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 bg-white border-slate-200">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="mapa">Mapa de Quartos</TabsTrigger>
            <TabsTrigger value="reservas">Reservas ({reservations.length})</TabsTrigger>
            <TabsTrigger value="governanca" className="flex items-center gap-1">
              <Brush className="w-4 h-4" />
              Governança
              {stats.sujos > 0 && (
                <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{stats.sujos}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "mapa" && (
          <>
            {/* Filters */}
            <div className="flex gap-2">
              {["todos", "livre", "ocupado", "reservado", "sujo"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    filterStatus === status && "bg-indigo-600 hover:bg-indigo-700",
                    filterStatus !== status && "border-slate-200"
                  )}
                >
                  {status === "todos" ? "Todos" : statusConfig[status as keyof typeof statusConfig]?.label}
                </Button>
              ))}
            </div>

            {/* Room Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredRooms.map((room, index) => {
                    const config = statusConfig[room.status];
                    const StatusIcon = config.icon;
                    const stayInfo = room.checkinDate && room.checkoutDate ? calculateStayTime(room.checkinDate, room.checkoutDate) : null;

                    return (
                      <motion.div
                        key={room.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-all duration-300 overflow-hidden group hover:shadow-lg hover:-translate-y-1",
                            config.bg, "border-2", config.border,
                            selectedRoom?.id === room.id && "ring-2 ring-indigo-500"
                          )}
                          onClick={() => handleRoomClick(room)}
                        >
                          {/* Room Image */}
                          <div className="h-24 relative overflow-hidden">
                            <RoomThumb
                              foto={room.foto}
                              nome={room.nome}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <Badge className={cn("absolute top-2 right-2 text-[10px]", config.badge)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <div className="absolute bottom-2 left-2">
                              <p className="text-white font-bold text-lg drop-shadow-lg">{room.nome}</p>
                            </div>
                          </div>

                          {/* Room Info */}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-[10px] border-slate-300">{room.tipo}</Badge>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {room.capacidade}
                              </span>
                            </div>

                            {room.hospede && (
                              <p className="text-xs text-slate-600 truncate mb-1">
                                <User className="w-3 h-3 inline mr-1" />
                                {room.hospede}
                              </p>
                            )}

                            {/* Tempo de estadia */}
                            {stayInfo && room.status === "ocupado" && (
                              <div className="mt-2 p-2 bg-white/50 rounded-lg text-xs">
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Timer className="w-3 h-3" />
                                  <span>{stayInfo.totalDays} dias contratados</span>
                                </div>
                                <div className={cn(
                                  "flex items-center gap-1 font-medium",
                                  stayInfo.isOverdue ? "text-red-600" : "text-blue-600"
                                )}>
                                  <Clock className="w-3 h-3" />
                                  {stayInfo.isOverdue ? (
                                    <span>Checkout atrasado!</span>
                                  ) : (
                                    <span>Restam {stayInfo.remainingDays}d {stayInfo.remainingHours}h</span>
                                  )}
                                </div>
                              </div>
                            )}

                            <p className={cn("font-bold text-lg mt-2", config.text)}>
                              R$ {room.preco}
                              <span className="text-xs font-normal text-slate-400">/noite</span>
                            </p>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {filteredRooms.length === 0 && (
                <div className="text-center py-12">
                  <Bed className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Nenhum quarto encontrado</p>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-200">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded", config.bg, "border", config.border)} />
                    <span className="text-sm text-slate-500">{config.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {activeTab === "reservas" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Próximas Reservas</h3>
            <div className="space-y-3">
              {reservations.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma reserva encontrada</p>
                </div>
              ) : (
                reservations.map((reservation, index) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{reservation.hospede}</p>
                        <p className="text-sm text-slate-500">Quarto {reservation.quarto} • {reservation.tipo}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays className="h-4 w-4" />
                          <span>{reservation.checkin.toLocaleDateString('pt-BR')}</span>
                          <span className="text-slate-400">→</span>
                          <span>{reservation.checkout.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-sm font-semibold text-indigo-600">R$ {reservation.valor.toLocaleString('pt-BR')}</p>
                      </div>

                      <Badge className="px-3 bg-emerald-100 text-emerald-700">
                        <Check className="h-3 w-3 mr-1" />
                        {reservation.status}
                      </Badge>

                      <div className="flex gap-2">
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleCheckin(reservation.id, reservation.hospede)}>
                          <KeyRound className="h-4 w-4 mr-1" />
                          Check-in
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleCancelReservation(reservation.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Governança Tab - Painel de Limpeza */}
        {activeTab === "governanca" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header da Governança */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Brush className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Painel de Governança</h2>
                  <p className="text-sm text-slate-500">Gerencie a limpeza dos quartos</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 px-3 py-1.5 text-sm">
                {stats.sujos} {stats.sujos === 1 ? "quarto" : "quartos"} aguardando limpeza
              </Badge>
            </div>

            {/* Lista de Quartos para Limpeza */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Quartos para Limpar</h3>
              </div>

              {stats.sujos === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Tudo limpo!</h3>
                  <p className="text-slate-500">Não há quartos aguardando limpeza no momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.filter(r => r.status === "sujo").map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4 bg-amber-50 border-2 border-amber-200 hover:shadow-lg transition-all">
                        {/* Header do Card */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                              {room.nome}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{room.tipo}</p>
                              <p className="text-xs text-slate-500">Andar {room.andar}</p>
                            </div>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Limpeza
                          </Badge>
                        </div>

                        {/* Informações */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users className="w-4 h-4" />
                            <span>Capacidade: {room.capacidade} pessoas</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Bed className="w-4 h-4" />
                            <span>R$ {room.preco}/noite</span>
                          </div>
                        </div>

                        {/* Imagem */}
                        <div className="mb-4 rounded-lg overflow-hidden h-24">
                          <RoomThumb
                            foto={room.foto}
                            nome={room.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Botão de Conclusão */}
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => markRoomClean(room.id, room.nome)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Concluir Limpeza
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo Geral */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Resumo do Dia</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <DoorOpen className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
                  <p className="text-2xl font-bold text-emerald-600">{stats.livres}</p>
                  <p className="text-sm text-slate-500">Disponíveis</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <DoorClosed className="w-6 h-6 mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-600">{stats.ocupados}</p>
                  <p className="text-sm text-slate-500">Ocupados</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <Sparkles className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                  <p className="text-2xl font-bold text-amber-600">{stats.sujos}</p>
                  <p className="text-sm text-slate-500">Limpeza</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <CalendarDays className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{stats.reservados}</p>
                  <p className="text-sm text-slate-500">Reservados</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Room Detail Modal */}
        <Dialog open={showRoomDetailModal} onOpenChange={setShowRoomDetailModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Quarto {selectedRoom?.nome}</DialogTitle>
              <DialogDescription>{selectedRoom?.tipo} • Capacidade: {selectedRoom?.capacidade} pessoas</DialogDescription>
            </DialogHeader>

            {selectedRoom && (
              <div className="space-y-4 mt-4">
                <RoomThumb
                  foto={selectedRoom.foto}
                  nome={selectedRoom.nome}
                  className="w-full h-48 object-cover rounded-lg"
                />

                {selectedRoom.hospede && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                    <p className="text-sm text-slate-500">Hóspede atual</p>
                    <p className="font-semibold text-slate-900">{selectedRoom.hospede}</p>
                    {selectedRoom.telefone && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {selectedRoom.telefone}
                      </p>
                    )}
                    {selectedRoom.email && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {selectedRoom.email}
                      </p>
                    )}
                    {selectedRoom.checkinDate && selectedRoom.checkoutDate && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        {(() => {
                          const stayInfo = calculateStayTime(selectedRoom.checkinDate, selectedRoom.checkoutDate);
                          return (
                            <>
                              <p className="text-sm text-slate-600">
                                <CalendarDays className="w-4 h-4 inline mr-2" />
                                {selectedRoom.checkinDate.toLocaleDateString('pt-BR')} → {selectedRoom.checkoutDate.toLocaleDateString('pt-BR')}
                              </p>
                              <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Contratado:</span>
                                  <span className="font-semibold">{stayInfo.totalDays} dias</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-slate-600">Restante:</span>
                                  <span className={cn("font-semibold", stayInfo.isOverdue ? "text-red-600" : "text-blue-600")}>
                                    {stayInfo.isOverdue ? "Checkout atrasado!" : `${stayInfo.remainingDays} dias e ${stayInfo.remainingHours} horas`}
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  {selectedRoom.status === "ocupado" && (
                    <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleStartCheckout}>
                      Realizar Check-out
                    </Button>
                  )}
                  {selectedRoom.status === "sujo" && (
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => markRoomClean(selectedRoom.id, selectedRoom.nome)}>
                      Marcar como Limpo
                    </Button>
                  )}
                  {selectedRoom.status === "reservado" && (
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                      if (selectedRoom.reservationId && selectedRoom.hospede) {
                        handleCheckin(selectedRoom.reservationId, selectedRoom.hospede);
                      }
                    }}>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Realizar Check-in
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowRoomDetailModal(false)}>Fechar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* New Reservation Modal */}
        <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Reserva</DialogTitle>
              <DialogDescription>
                {selectedRoom ? `Reservar Quarto ${selectedRoom.nome} - ${selectedRoom.tipo}` : "Criar uma nova reserva"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReservation} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hospede">Nome do Hóspede *</Label>
                  <Input
                    id="hospede"
                    placeholder="Nome completo"
                    className="bg-slate-50"
                    value={reservationForm.hospede}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, hospede: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    className="bg-slate-50"
                    value={reservationForm.telefone}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  className="bg-slate-50"
                  value={reservationForm.email}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quarto">Quarto *</Label>
                <Select
                  value={reservationForm.quartoId}
                  onValueChange={(value) => setReservationForm(prev => ({ ...prev, quartoId: value }))}
                >
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Selecione o quarto" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.filter(r => r.status === "livre").map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.nome} - {room.tipo} (R$ {room.preco}/noite)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkin">Check-in *</Label>
                  <Input
                    id="checkin"
                    type="date"
                    className="bg-slate-50"
                    value={reservationForm.checkin}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, checkin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout">Check-out *</Label>
                  <Input
                    id="checkout"
                    type="date"
                    className="bg-slate-50"
                    value={reservationForm.checkout}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, checkout: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowReservationModal(false)}>Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirmar Reserva
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Checkout Modal with Frigobar */}
        <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-red-600" />
                Check-out - Quarto {selectedRoom?.nome}
              </DialogTitle>
              <DialogDescription>
                Hóspede: {selectedRoom?.hospede}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                {/* Step 1: Frigobar */}
                {checkoutStep === "frigobar" && (
                  <motion.div
                    key="frigobar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <Coffee className="w-6 h-6 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">Houve consumo no frigobar?</p>
                        <p className="text-sm text-slate-500">Adicione os itens consumidos para incluir na conta</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="hasFrigobar"
                          checked={hasFrigobar}
                          onCheckedChange={(checked) => setHasFrigobar(checked as boolean)}
                        />
                        <Label htmlFor="hasFrigobar">Sim</Label>
                      </div>
                    </div>

                    {hasFrigobar && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-3 gap-2">
                          {frigobarItems.map(item => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              className="flex-col h-auto py-2 hover:bg-amber-50 hover:border-amber-300"
                              onClick={() => addFrigobarItem(item)}
                            >
                              <span className="text-xs">{item.nome}</span>
                              <span className="text-[10px] text-slate-500">R$ {item.preco.toFixed(2)}</span>
                            </Button>
                          ))}
                        </div>

                        {frigobarCart.length > 0 && (
                          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                            <p className="font-semibold text-slate-900 flex items-center gap-2">
                              <Wine className="w-4 h-4" />
                              Itens Consumidos
                            </p>
                            {frigobarCart.map(item => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span>{item.quantidade}x {item.nome}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeFrigobarItem(item.id)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                              <span>Total Frigobar</span>
                              <span className="text-amber-600">R$ {totalFrigobar.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowCheckoutModal(false)}>Cancelar</Button>
                      <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => setCheckoutStep("confirm")}>
                        Continuar
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Confirm */}
                {checkoutStep === "confirm" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Resumo da Conta */}
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-slate-900">Extrato de Check-out</h3>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                      {/* Hospedagem */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">
                            Hospedagem ({selectedRoom?.checkinDate && selectedRoom?.checkoutDate ? Math.ceil((selectedRoom.checkoutDate.getTime() - selectedRoom.checkinDate.getTime()) / (1000 * 60 * 60 * 24)) : 0} diárias)
                          </span>
                        </div>
                        <span className="font-semibold">R$ {stayTotal.toFixed(2)}</span>
                      </div>

                      {/* Frigobar */}
                      {totalFrigobar > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Wine className="w-4 h-4 text-amber-600" />
                            <span className="text-slate-600">Frigobar</span>
                          </div>
                          <span className="font-semibold">R$ {totalFrigobar.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Consumo Restaurante (lançamentos pendentes) */}
                      {loadingCharges ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Carregando lançamentos...</span>
                        </div>
                      ) : pendingCharges.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                            <UtensilsCrossed className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-medium text-slate-700">Consumo Restaurante</span>
                          </div>
                          <ScrollArea className="max-h-32">
                            <div className="space-y-1 pl-6">
                              {pendingCharges.map((charge) => (
                                <div key={charge.id} className="flex justify-between text-sm">
                                  <span className="text-slate-500 truncate max-w-[200px]">
                                    {charge.descricao || "Consumo"}
                                  </span>
                                  <span className="font-medium">R$ {charge.valor.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <div className="flex justify-between items-center pl-6">
                            <span className="text-slate-600 text-sm">Total Restaurante</span>
                            <span className="font-semibold text-indigo-600">R$ {totalPendingCharges.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Total Geral */}
                      <div className="pt-3 border-t-2 border-slate-300 flex justify-between text-lg font-bold">
                        <span>Total a Pagar</span>
                        <span className="text-indigo-600">R$ {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setCheckoutStep("frigobar")}>Voltar</Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={confirmCheckout}>
                        <Check className="w-4 h-4 mr-2" />
                        Confirmar Check-out
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Complete */}
                {checkoutStep === "complete" && (
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
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Check-out Realizado!</h3>
                    <p className="text-slate-500">O quarto será marcado para limpeza</p>
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
      </div>
    </AppLayout>
  );
}
