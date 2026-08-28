import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  tablesRoomsService,
  type TableRoom,
  roomContentService,
  type RoomContent,
  packagesService,
  type PackageItem,
  tipsService,
  type Tip,
  type TipTipo,
  paymentMethodsService,
  type PaymentMethod,
  type PaymentMethodTipo,
  organizationsService,
  icalFeedsService,
  type IcalFeedConfig,
} from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Globe, Hotel, Gift, MapPin, CreditCard, Plus, Trash2, Loader2, Calendar } from "lucide-react";

const TIP_TIPOS: { value: TipTipo; label: string }[] = [
  { value: "gastronomia", label: "Gastronomia" },
  { value: "passeio", label: "Passeio" },
  { value: "transfer", label: "Transfer" },
];

const PAYMENT_TIPOS: { value: PaymentMethodTipo; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
];

export default function SiteConteudo() {
  const { activeOrganization, refreshOrganizations } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [rooms, setRooms] = useState<TableRoom[]>([]);
  const [roomContents, setRoomContents] = useState<Record<string, RoomContent>>({});
  const [icalFeeds, setIcalFeeds] = useState<Record<string, IcalFeedConfig>>({});
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [siteSlug, setSiteSlug] = useState("");
  const [sitePublished, setSitePublished] = useState(false);
  const [savingSite, setSavingSite] = useState(false);

  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [tipForm, setTipForm] = useState<{ tipo: TipTipo; titulo: string; descricao: string }>({
    tipo: "passeio",
    titulo: "",
    descricao: "",
  });

  const [pkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState({ nome: "", descricao: "", precoPromocional: "" });

  useEffect(() => {
    if (!activeOrganization) return;
    loadAll();
    setSiteSlug(activeOrganization.siteSlug || "");
    setSitePublished(activeOrganization.sitePublished || false);
  }, [activeOrganization?.id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [roomList, pkgList, tipList, payList, feedList] = await Promise.all([
        tablesRoomsService.list({ tipo: "quarto" }),
        packagesService.list(),
        tipsService.list(),
        paymentMethodsService.list(),
        icalFeedsService.list(),
      ]);
      setRooms(roomList);
      setPackages(pkgList);
      setTips(tipList);
      setPaymentMethods(payList);

      const feedMap: Record<string, IcalFeedConfig> = {};
      feedList.forEach((f) => (feedMap[f.tableRoomId] = f));
      setIcalFeeds(feedMap);

      const contents = await Promise.all(roomList.map((r) => roomContentService.get(r.id)));
      const contentMap: Record<string, RoomContent> = {};
      roomList.forEach((r, i) => {
        if (contents[i]) contentMap[r.id] = contents[i]!;
      });
      setRoomContents(contentMap);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao carregar conteúdo do site", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoomContent = async (roomId: string) => {
    const content = roomContents[roomId];
    try {
      const saved = await roomContentService.upsert(roomId, {
        descricaoLonga: content?.descricaoLonga || "",
        fotos: content?.fotos || [],
        tarifaBaixaTemp: content?.tarifaBaixaTemp ?? null,
        tarifaAltaTemp: content?.tarifaAltaTemp ?? null,
      });
      setRoomContents((prev) => ({ ...prev, [roomId]: saved }));
      toast({ title: "Salvo", description: "Conteúdo do quarto atualizado." });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar quarto", variant: "destructive" });
    }
  };

  const handleSaveIcalUrl = async (roomId: string, url: string) => {
    try {
      const saved = await icalFeedsService.upsert(roomId, url || null);
      setIcalFeeds((prev) => ({ ...prev, [roomId]: saved }));
      toast({ title: "Salvo", description: "URL do iCal atualizada." });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar URL do iCal", variant: "destructive" });
    }
  };

  const updateRoomField = (roomId: string, field: keyof RoomContent, value: any) => {
    setRoomContents((prev) => ({
      ...prev,
      [roomId]: { ...(prev[roomId] || ({} as RoomContent)), tableRoomId: roomId, [field]: value },
    }));
  };

  const handleCreateTip = async () => {
    if (!tipForm.titulo.trim()) return;
    try {
      const created = await tipsService.create({ tipo: tipForm.tipo, titulo: tipForm.titulo, descricao: tipForm.descricao });
      setTips((prev) => [...prev, created]);
      setTipDialogOpen(false);
      setTipForm({ tipo: "passeio", titulo: "", descricao: "" });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao criar dica", variant: "destructive" });
    }
  };

  const handleDeleteTip = async (id: string) => {
    await tipsService.delete(id);
    setTips((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreatePackage = async () => {
    if (!pkgForm.nome.trim()) return;
    try {
      const created = await packagesService.create({
        nome: pkgForm.nome,
        descricao: pkgForm.descricao,
        precoPromocional: pkgForm.precoPromocional ? parseFloat(pkgForm.precoPromocional) : null,
      });
      setPackages((prev) => [...prev, created]);
      setPkgDialogOpen(false);
      setPkgForm({ nome: "", descricao: "", precoPromocional: "" });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao criar pacote", variant: "destructive" });
    }
  };

  const handleDeletePackage = async (id: string) => {
    await packagesService.delete(id);
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePaymentMethod = async (tipo: PaymentMethodTipo, active: boolean) => {
    const existing = paymentMethods.find((p) => p.tipo === tipo);
    try {
      if (existing) {
        const updated = await paymentMethodsService.update(existing.id, { ativo: active });
        setPaymentMethods((prev) => prev.map((p) => (p.id === existing.id ? updated : p)));
      } else if (active) {
        const created = await paymentMethodsService.create({ tipo, ativo: true });
        setPaymentMethods((prev) => [...prev, created]);
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao atualizar forma de pagamento", variant: "destructive" });
    }
  };

  const handleSaveSiteSettings = async () => {
    if (!activeOrganization) return;
    setSavingSite(true);
    try {
      await organizationsService.update(activeOrganization.id, {
        siteSlug: siteSlug.trim() || null,
        sitePublished,
      });
      await refreshOrganizations();
      toast({ title: "Salvo", description: "Configurações do site atualizadas." });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar configurações do site", variant: "destructive" });
    } finally {
      setSavingSite(false);
    }
  };

  if (!activeOrganization) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Selecione uma organização.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Site &amp; Conteúdo
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o que aparece no site de reservas público de {activeOrganization.nome}.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="quartos">
            <TabsList>
              <TabsTrigger value="quartos"><Hotel className="h-4 w-4 mr-1" /> Quartos</TabsTrigger>
              <TabsTrigger value="pacotes"><Gift className="h-4 w-4 mr-1" /> Pacotes</TabsTrigger>
              <TabsTrigger value="dicas"><MapPin className="h-4 w-4 mr-1" /> Dicas</TabsTrigger>
              <TabsTrigger value="pagamento"><CreditCard className="h-4 w-4 mr-1" /> Pagamento</TabsTrigger>
              <TabsTrigger value="publicacao"><Globe className="h-4 w-4 mr-1" /> Publicação</TabsTrigger>
            </TabsList>

            {/* QUARTOS */}
            <TabsContent value="quartos" className="space-y-4 mt-4">
              {rooms.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">
                  Nenhum quarto cadastrado ainda. Cadastre quartos em Configurações antes de editar o conteúdo do site.
                </p>
              )}
              {rooms.map((room) => {
                const content = roomContents[room.id];
                const feed = icalFeeds[room.id];
                return (
                  <div key={room.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{room.nome}</h3>
                      <Button size="sm" onClick={() => handleSaveRoomContent(room.id)}>Salvar</Button>
                    </div>
                    <div className="grid gap-2">
                      <Label>Descrição para o site</Label>
                      <Textarea
                        value={content?.descricaoLonga || ""}
                        onChange={(e) => updateRoomField(room.id, "descricaoLonga", e.target.value)}
                        placeholder="Descrição que aparece no site público"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Fotos (uma URL por linha)</Label>
                      <Textarea
                        rows={3}
                        value={(content?.fotos || []).join("\n")}
                        onChange={(e) => updateRoomField(room.id, "fotos", e.target.value.split("\n").filter(Boolean))}
                        placeholder="/uploads/algas-marinhas/quarto-duplo.jpg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Tarifa baixa temporada (R$)</Label>
                        <Input
                          type="number"
                          value={content?.tarifaBaixaTemp ?? ""}
                          onChange={(e) => updateRoomField(room.id, "tarifaBaixaTemp", e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tarifa alta temporada (R$)</Label>
                        <Input
                          type="number"
                          value={content?.tarifaAltaTemp ?? ""}
                          onChange={(e) => updateRoomField(room.id, "tarifaAltaTemp", e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 pt-2 border-t border-border">
                      <Label className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> URL de export iCal da Booking.com
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          defaultValue={feed?.importUrl || ""}
                          placeholder="Ainda não coletado com a proprietária"
                          onBlur={(e) => {
                            if (e.target.value !== (feed?.importUrl || "")) {
                              handleSaveIcalUrl(room.id, e.target.value);
                            }
                          }}
                        />
                        {feed?.lastSyncStatus && (
                          <Badge variant={feed.lastSyncStatus === "ok" ? "secondary" : "destructive"}>
                            {feed.lastSyncStatus === "ok" ? "Sincronizado" : "Erro"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* PACOTES */}
            <TabsContent value="pacotes" className="space-y-4 mt-4">
              <Button size="sm" onClick={() => setPkgDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo pacote</Button>
              <div className="grid gap-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pkg.nome}</p>
                      <p className="text-sm text-muted-foreground">{pkg.descricao}</p>
                      {pkg.precoPromocional != null && (
                        <p className="text-sm font-semibold mt-1">R$ {pkg.precoPromocional.toFixed(2)}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {packages.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum pacote cadastrado.</p>}
              </div>
            </TabsContent>

            {/* DICAS */}
            <TabsContent value="dicas" className="space-y-4 mt-4">
              <Button size="sm" onClick={() => setTipDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova dica</Button>
              {TIP_TIPOS.map(({ value, label }) => (
                <div key={value}>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mt-4 mb-2">{label}</h4>
                  <div className="grid gap-2">
                    {tips.filter((t) => t.tipo === value).map((tip) => (
                      <div key={tip.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tip.titulo}</p>
                          <p className="text-sm text-muted-foreground">{tip.descricao}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTip(tip.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {tips.filter((t) => t.tipo === value).length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma dica de {label.toLowerCase()} cadastrada.</p>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* PAGAMENTO */}
            <TabsContent value="pagamento" className="space-y-3 mt-4">
              {PAYMENT_TIPOS.map(({ value, label }) => {
                const existing = paymentMethods.find((p) => p.tipo === value);
                const active = existing?.ativo ?? false;
                return (
                  <div key={value} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                    <span className="font-medium">{label}</span>
                    <Switch checked={active} onCheckedChange={(checked) => togglePaymentMethod(value, checked)} />
                  </div>
                );
              })}
            </TabsContent>

            {/* PUBLICAÇÃO */}
            <TabsContent value="publicacao" className="space-y-4 mt-4 max-w-lg">
              <div className="grid gap-2">
                <Label>Endereço do site (slug)</Label>
                <Input value={siteSlug} onChange={(e) => setSiteSlug(e.target.value)} placeholder="algas-marinhas" />
                {siteSlug && (
                  <p className="text-sm text-muted-foreground">
                    Link público: <code>/reservar/{siteSlug}</code>
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium">Site publicado</p>
                  <p className="text-sm text-muted-foreground">Se desligado, o site fica indisponível para hóspedes.</p>
                </div>
                <Switch checked={sitePublished} onCheckedChange={setSitePublished} />
              </div>
              <Button onClick={handleSaveSiteSettings} disabled={savingSite}>
                {savingSite && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova dica</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <select
                className="border border-input rounded-md h-10 px-3 bg-background"
                value={tipForm.tipo}
                onChange={(e) => setTipForm({ ...tipForm, tipo: e.target.value as TipTipo })}
              >
                {TIP_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={tipForm.titulo} onChange={(e) => setTipForm({ ...tipForm, titulo: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea value={tipForm.descricao} onChange={(e) => setTipForm({ ...tipForm, descricao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTipDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTip}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pkgDialogOpen} onOpenChange={setPkgDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo pacote</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={pkgForm.nome} onChange={(e) => setPkgForm({ ...pkgForm, nome: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea value={pkgForm.descricao} onChange={(e) => setPkgForm({ ...pkgForm, descricao: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Preço promocional (R$)</Label>
              <Input type="number" value={pkgForm.precoPromocional} onChange={(e) => setPkgForm({ ...pkgForm, precoPromocional: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPkgDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePackage}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
