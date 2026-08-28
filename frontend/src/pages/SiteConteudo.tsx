import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { PhotoManager } from "@/components/PhotoManager";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { assetUrl, cn } from "@/lib/utils";
import { Globe, Hotel, Gift, MapPin, CreditCard, Plus, Trash2, Loader2, Calendar, Bed, ImageOff } from "lucide-react";

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
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);

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
    setSavingRoomId(roomId);
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
    } finally {
      setSavingRoomId(null);
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
      <div className="space-y-6 max-w-5xl">
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
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="quartos"><Hotel className="h-4 w-4 mr-1.5" /> Quartos</TabsTrigger>
              <TabsTrigger value="pacotes"><Gift className="h-4 w-4 mr-1.5" /> Pacotes</TabsTrigger>
              <TabsTrigger value="dicas"><MapPin className="h-4 w-4 mr-1.5" /> Dicas</TabsTrigger>
              <TabsTrigger value="pagamento"><CreditCard className="h-4 w-4 mr-1.5" /> Pagamento</TabsTrigger>
              <TabsTrigger value="publicacao"><Globe className="h-4 w-4 mr-1.5" /> Publicação</TabsTrigger>
            </TabsList>

            {/* QUARTOS — cada quarto é um painel que expande ao clicar */}
            <TabsContent value="quartos" className="mt-5">
              {rooms.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border py-16 text-center text-muted-foreground">
                  <Bed className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  Nenhum quarto cadastrado ainda. Cadastre quartos em Configurações antes de editar o conteúdo do site.
                </div>
              ) : (
                <Accordion type="single" collapsible defaultValue={rooms[0]?.id} className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
                  {rooms.map((room) => {
                    const content = roomContents[room.id];
                    const feed = icalFeeds[room.id];
                    const capaFoto = content?.fotos?.[0];
                    return (
                      <AccordionItem key={room.id} value={room.id} className="border-b-0">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 [&>svg]:text-muted-foreground">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                              {capaFoto ? (
                                <img src={assetUrl(capaFoto)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageOff className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-semibold text-base">{room.nome}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {room.capacidade && (
                                  <span className="text-xs text-muted-foreground">Até {room.capacidade} hóspedes</span>
                                )}
                                {content?.tarifaBaixaTemp != null && (
                                  <Badge variant="secondary" className="text-xs font-normal">R$ {content.tarifaBaixaTemp}/noite</Badge>
                                )}
                                {(content?.fotos?.length ?? 0) === 0 && (
                                  <Badge variant="outline" className="text-xs font-normal text-amber-600 border-amber-300">sem fotos</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-6 pt-1">
                          <div className="grid gap-5 pt-2">
                            <div className="grid gap-2">
                              <Label>Fotos</Label>
                              <PhotoManager
                                photos={content?.fotos || []}
                                onChange={(fotos) => updateRoomField(room.id, "fotos", fotos)}
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label>Descrição para o site</Label>
                              <Textarea
                                value={content?.descricaoLonga || ""}
                                onChange={(e) => updateRoomField(room.id, "descricaoLonga", e.target.value)}
                                placeholder="Descrição que aparece no site público"
                                rows={3}
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

                            <div className="grid gap-2 pt-3 border-t border-border">
                              <Label className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" /> URL de export iCal da Booking.com
                              </Label>
                              <div className="flex gap-2 items-center">
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
                                  <Badge variant={feed.lastSyncStatus === "ok" ? "secondary" : "destructive"} className="flex-shrink-0">
                                    {feed.lastSyncStatus === "ok" ? "Sincronizado" : "Erro"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <Button onClick={() => handleSaveRoomContent(room.id)} disabled={savingRoomId === room.id}>
                                {savingRoomId === room.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Salvar alterações
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </TabsContent>

            {/* PACOTES */}
            <TabsContent value="pacotes" className="space-y-4 mt-5">
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
            <TabsContent value="dicas" className="space-y-4 mt-5">
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
            <TabsContent value="pagamento" className="space-y-3 mt-5">
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
            <TabsContent value="publicacao" className="space-y-4 mt-5 max-w-lg">
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
