import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  icalFeedsService,
  type ExternalCalendarBlock,
  reservationsService,
  tablesRoomsService,
} from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, Loader2, PlusCircle } from "lucide-react";
import { format } from "date-fns";

export default function ReservasExternas() {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<ExternalCalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState<ExternalCalendarBlock | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await icalFeedsService.listUnlinkedBlocks();
      setBlocks(data);
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao carregar reservas externas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = async (block: ExternalCalendarBlock) => {
    setActiveBlock(block);
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    try {
      const room = await tablesRoomsService.get(block.tableRoomId);
      setDailyRate(room.precoBase ? String(room.precoBase) : "0");
    } catch {
      setDailyRate("0");
    }
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!activeBlock || !guestName.trim()) return;
    setSaving(true);
    try {
      const reservation = await reservationsService.create({
        roomId: activeBlock.tableRoomId,
        guestName,
        guestEmail: guestEmail || undefined,
        guestPhone: guestPhone || undefined,
        checkinDate: activeBlock.checkin,
        checkoutDate: activeBlock.checkout,
        dailyRate: parseFloat(dailyRate) || 0,
        notes: "Reserva originada de bloqueio importado da Booking.com (iCal).",
      });

      await icalFeedsService.linkBlock(activeBlock.id, reservation.id);

      toast({ title: "Reserva lançada", description: "Bloqueio vinculado à reserva com sucesso." });
      setDialogOpen(false);
      setBlocks((prev) => prev.filter((b) => b.id !== activeBlock.id));
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao lançar a reserva", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="h-8 w-8 text-primary" />
            Reservas externas para lançar
          </h1>
          <p className="text-muted-foreground mt-1">
            Datas bloqueadas importadas da Booking.com via iCal — o feed só traz datas, sem dados do
            hóspede. Complete cada uma com o que você vê na extranet da Booking.com.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
            <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum bloqueio pendente de lançamento.</p>
            <p className="text-sm mt-1">
              Isso aparece aqui quando a sincronização do iCal encontra uma reserva na Booking.com que
              ainda não existe no Lumina.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {blocks.map((block) => (
              <div key={block.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{block.tableRoom?.nome || "Quarto"}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(block.checkin), "dd/MM/yyyy")} → {format(new Date(block.checkout), "dd/MM/yyyy")}
                  </p>
                </div>
                <Button onClick={() => openDialog(block)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Lançar reserva
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar reserva</DialogTitle>
            <DialogDescription>
              {activeBlock && (
                <>
                  {activeBlock.tableRoom?.nome} · {format(new Date(activeBlock.checkin), "dd/MM/yyyy")} a{" "}
                  {format(new Date(activeBlock.checkout), "dd/MM/yyyy")}. Preencha com os dados do hóspede
                  vistos na extranet da Booking.com.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome do hóspede *</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Diária (R$)</Label>
              <Input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={saving || !guestName.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
