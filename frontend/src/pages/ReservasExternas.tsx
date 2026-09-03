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
import { CalendarClock, Loader2, PlusCircle, HelpCircle } from "lucide-react";
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

      toast({ title: "Reserva salva", description: "Agora ela aparece junto com as outras reservas do hotel." });
      setDialogOpen(false);
      setBlocks((prev) => prev.filter((b) => b.id !== activeBlock.id));
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar a reserva", variant: "destructive" });
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
            Reservas do Booking.com para completar
          </h1>
          <p className="text-muted-foreground mt-1">
            Quando alguém reserva pela Booking.com, esta tela mostra as datas que ficaram ocupadas.
          </p>
        </div>

        <div className="bg-accent/40 border border-border rounded-xl p-4 flex gap-3">
          <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p>
              <span className="font-medium text-foreground">Como funciona:</span> a Booking.com avisa o
              Lumina sempre que um quarto fica ocupado por lá, mas só manda as datas — não manda o nome,
              telefone ou e-mail do hóspede (isso só aparece na extranet da Booking.com).
            </p>
            <p>
              Por isso, cada bloqueio abaixo precisa que você complete com os dados do hóspede — copiando
              da extranet da Booking.com — para que a reserva apareça certinha aqui no sistema também,
              junto com as reservas feitas pelo telefone ou pelo seu site.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
            <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma reserva do Booking.com esperando ser completada.</p>
            <p className="text-sm mt-1">
              Assim que uma nova reserva chegar pela Booking.com, ela vai aparecer aqui automaticamente.
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
                  Completar reserva
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar reserva do Booking.com</DialogTitle>
            <DialogDescription>
              {activeBlock && (
                <>
                  Quarto {activeBlock.tableRoom?.nome} · {format(new Date(activeBlock.checkin), "dd/MM/yyyy")} a{" "}
                  {format(new Date(activeBlock.checkout), "dd/MM/yyyy")}. Copie o nome e o contato do
                  hóspede que aparecem na extranet da Booking.com.
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
              Salvar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
