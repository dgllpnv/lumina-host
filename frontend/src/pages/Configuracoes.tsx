import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { tablesRoomsService, roomContentService, type TableRoom, type RoomContent } from "@/services";
import { PhotoManager } from "@/components/PhotoManager";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  UtensilsCrossed,
  BedDouble,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TableRoomStatus = TableRoom["status"];

// Mesas usam os 4 status livremente. Quartos só podem ser marcados manualmente
// como "Livre" ou "Sujo" (limpeza) — "Ocupado" e "Reservado" são consequência de
// uma reserva real (check-in/check-out em /pos-hotel), nunca escolhidos à mão aqui.
// Definir isso manualmente deixava o quarto "reservado" sem reserva nenhuma por
// trás, e o botão de check-in em /pos-hotel travava sem fazer nada.
const STATUS_OPTIONS_MESA: { value: TableRoomStatus; label: string }[] = [
  { value: "livre", label: "Livre" },
  { value: "ocupado", label: "Ocupado" },
  { value: "sujo", label: "Sujo" },
  { value: "reservado", label: "Reservado" },
];

const STATUS_OPTIONS_QUARTO: { value: TableRoomStatus; label: string }[] = [
  { value: "livre", label: "Livre" },
  { value: "sujo", label: "Aguardando limpeza" },
];

const emptyForm = {
  nome: "",
  tipo: "mesa",
  capacidade: 4,
  status: "livre" as TableRoomStatus,
  andar: null as number | null,
  descricao: "",
  precoBase: null as number | null,
};

export default function Configuracoes() {
  const { profile } = useAuth();
  const { activeOrganization } = useOrganization();
  const { toast } = useToast();

  // "restaurante" | "pousada" | "pousada_restaurante" — mesas só fazem sentido
  // pra quem tem restaurante/PDV; uma pousada pura não gerencia mesas.
  const hasRestaurante = activeOrganization?.tipo === "restaurante" || activeOrganization?.tipo === "pousada_restaurante";
  const hasPousada = activeOrganization?.tipo === "pousada" || activeOrganization?.tipo === "pousada_restaurante";

  const [items, setItems] = useState<TableRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"mesas" | "quartos">(hasRestaurante ? "mesas" : "quartos");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TableRoom | null>(null);
  const [deletingItem, setDeletingItem] = useState<TableRoom | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [roomContent, setRoomContent] = useState<RoomContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (!hasRestaurante && activeTab === "mesas") setActiveTab("quartos");
  }, [hasRestaurante, activeTab]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await tablesRoomsService.list();
      setItems([...data].sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error("Error fetching items:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar mesas/quartos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setRoomContent(null);
    setForm({
      ...emptyForm,
      tipo: activeTab === "mesas" ? "mesa" : "quarto",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = async (item: TableRoom) => {
    setEditingItem(item);
    setForm({
      nome: item.nome,
      tipo: item.tipo,
      capacidade: item.capacidade || 4,
      status: item.status,
      andar: item.andar,
      descricao: item.descricao || "",
      precoBase: item.precoBase,
    });
    setIsDialogOpen(true);

    if (item.tipo === "quarto") {
      setRoomContent(null);
      setLoadingContent(true);
      try {
        const content = await roomContentService.get(item.id);
        setRoomContent(content);
      } catch (err) {
        console.error("Error fetching room content:", err);
      } finally {
        setLoadingContent(false);
      }
    }
  };

  const handleOpenDelete = (item: TableRoom) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome e obrigatorio",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        capacidade: form.capacidade || undefined,
        status: form.status,
      };

      // Adicionar campos de quarto apenas se for tipo quarto
      if (form.tipo === "quarto") {
        payload.andar = form.andar || undefined;
        payload.descricao = form.descricao?.trim() || undefined;
        payload.precoBase = form.precoBase || undefined;
      }

      if (editingItem) {
        await tablesRoomsService.update(editingItem.id, payload);
        if (form.tipo === "quarto" && roomContent) {
          await roomContentService.upsert(editingItem.id, {
            descricaoLonga: roomContent.descricaoLonga || "",
            fotos: roomContent.fotos || [],
            tarifaBaixaTemp: roomContent.tarifaBaixaTemp ?? null,
            tarifaAltaTemp: roomContent.tarifaAltaTemp ?? null,
          });
        }
        toast({
          title: "Sucesso",
          description: `${form.tipo === "mesa" ? "Mesa" : "Quarto"} atualizado com sucesso`,
        });
      } else {
        await tablesRoomsService.create(payload as any);
        toast({
          title: "Sucesso",
          description: `${form.tipo === "mesa" ? "Mesa" : "Quarto"} cadastrado com sucesso`,
        });
      }

      setIsDialogOpen(false);
      fetchItems();
    } catch (err) {
      console.error("Error saving item:", err);
      toast({
        title: "Erro",
        description: "Falha ao salvar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    setSaving(true);
    try {
      await tablesRoomsService.delete(deletingItem.id);

      toast({
        title: "Sucesso",
        description: "Removido com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      toast({
        title: "Erro",
        description: "Falha ao remover",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: TableRoomStatus) => {
    const styles = {
      livre: "bg-success/10 text-success border-success/20",
      ocupado: "bg-destructive/10 text-destructive border-destructive/20",
      sujo: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      reservado: "bg-primary/10 text-primary border-primary/20",
    };
    const labels = {
      livre: "Livre",
      ocupado: "Ocupado",
      sujo: "Sujo",
      reservado: "Reservado",
    };
    return (
      <Badge variant="outline" className={cn(styles[status])}>
        {labels[status]}
      </Badge>
    );
  };

  const mesas = items.filter((i) => i.tipo === "mesa");
  const quartos = items.filter((i) => i.tipo === "quarto");
  const currentItems = activeTab === "mesas" ? mesas : quartos;

  const stats = {
    mesas: {
      total: mesas.length,
      livres: mesas.filter((m) => m.status === "livre").length,
      ocupadas: mesas.filter((m) => m.status === "ocupado").length,
    },
    quartos: {
      total: quartos.length,
      livres: quartos.filter((q) => q.status === "livre").length,
      ocupados: quartos.filter((q) => q.status === "ocupado").length,
    },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Configuracoes
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasRestaurante && hasPousada
                ? "Gerencie mesas e quartos da sua unidade"
                : hasRestaurante
                ? "Gerencie as mesas da sua unidade"
                : "Gerencie os quartos da sua unidade"}
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {activeTab === "mesas" ? "Nova Mesa" : "Novo Quarto"}
          </Button>
        </motion.div>

        {/* Tabs — só faz sentido mostrar as duas abas se a unidade tiver mesas E quartos */}
        {hasRestaurante && hasPousada ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "mesas" | "quartos")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="mesas" className="gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Mesas ({stats.mesas.total})
            </TabsTrigger>
            <TabsTrigger value="quartos" className="gap-2">
              <BedDouble className="h-4 w-4" />
              Quartos ({stats.quartos.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mesas" className="space-y-4 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <p className="text-sm text-muted-foreground">Total de Mesas</p>
                <p className="text-2xl font-bold text-foreground">{stats.mesas.total}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <p className="text-sm text-muted-foreground">Livres</p>
                <p className="text-2xl font-bold text-success">{stats.mesas.livres}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <p className="text-sm text-muted-foreground">Ocupadas</p>
                <p className="text-2xl font-bold text-destructive">{stats.mesas.ocupadas}</p>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="quartos" className="space-y-4 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <p className="text-sm text-muted-foreground">Total de Quartos</p>
                <p className="text-2xl font-bold text-foreground">{stats.quartos.total}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <p className="text-sm text-muted-foreground">Livres</p>
                <p className="text-2xl font-bold text-success">{stats.quartos.livres}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <p className="text-sm text-muted-foreground">Ocupados</p>
                <p className="text-2xl font-bold text-destructive">{stats.quartos.ocupados}</p>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Total de {hasRestaurante ? "Mesas" : "Quartos"}</p>
              <p className="text-2xl font-bold text-foreground">{hasRestaurante ? stats.mesas.total : stats.quartos.total}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Livres</p>
              <p className="text-2xl font-bold text-success">{hasRestaurante ? stats.mesas.livres : stats.quartos.livres}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground">Ocupad{hasRestaurante ? "as" : "os"}</p>
              <p className="text-2xl font-bold text-destructive">{hasRestaurante ? stats.mesas.ocupadas : stats.quartos.ocupados}</p>
            </motion.div>
          </div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {activeTab === "mesas" ? (
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
              ) : (
                <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-50" />
              )}
              <p>Nenhum {activeTab === "mesas" ? "mesa" : "quarto"} cadastrado</p>
              <p className="text-sm mt-1">
                Clique em "{activeTab === "mesas" ? "Nova Mesa" : "Novo Quarto"}" para
                adicionar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4" />
                      Capacidade
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {currentItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border last:border-0"
                    >
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell className="text-center">
                        {item.capacidade || "-"} {item.capacidade ? "pessoas" : ""}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(item)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={form.tipo === "quarto" ? "sm:max-w-[520px]" : "sm:max-w-[400px]"}>
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? `Editar ${form.tipo === "mesa" ? "Mesa" : "Quarto"}`
                : `${form.tipo === "mesa" ? "Nova Mesa" : "Novo Quarto"}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize as informacoes"
                : "Preencha os dados para cadastrar"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder={form.tipo === "mesa" ? "Ex: Mesa 01" : "Ex: Quarto 101"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacidade">Capacidade</Label>
                <Input
                  id="capacidade"
                  type="number"
                  min="1"
                  value={form.capacidade}
                  onChange={(e) =>
                    setForm({ ...form, capacidade: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as TableRoomStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {form.tipo === "quarto" && (form.status === "ocupado" || form.status === "reservado") && (
                      <SelectItem value={form.status} disabled>
                        {form.status === "ocupado" ? "Ocupado (definido pela reserva)" : "Reservado (definido pela reserva)"}
                      </SelectItem>
                    )}
                    {(form.tipo === "quarto" ? STATUS_OPTIONS_QUARTO : STATUS_OPTIONS_MESA).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.tipo === "quarto" && (
                  <p className="text-xs text-muted-foreground">
                    "Ocupado" e "Reservado" só mudam através do check-in/check-out em Gestão de Hospedagem.
                  </p>
                )}
              </div>
            </div>

            {/* Campos avancados para quartos */}
            {form.tipo === "quarto" && (
              <>
                <div className="grid gap-2">
                  <Label>Fotos do quarto</Label>
                  {editingItem ? (
                    loadingContent ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <PhotoManager
                        photos={roomContent?.fotos || []}
                        onChange={(fotos) =>
                          setRoomContent((prev) => ({ ...(prev || ({} as RoomContent)), tableRoomId: editingItem.id, fotos }))
                        }
                      />
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Cadastre o quarto primeiro para poder anexar fotos.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="andar">Andar</Label>
                    <Input
                      id="andar"
                      type="number"
                      min="0"
                      value={form.andar ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, andar: e.target.value ? parseInt(e.target.value) : null })
                      }
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preco_base">Preco Base (R$)</Label>
                    <Input
                      id="preco_base"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precoBase ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, precoBase: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descricao</Label>
                  <Textarea
                    id="descricao"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Descricao do quarto, amenidades, vista, etc."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{deletingItem?.nome}"? Esta acao nao pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
