import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { inventoryService, type InventoryItem } from "@/services";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIAS = [
  "Bebidas",
  "Carnes",
  "Frios",
  "Hortifruti",
  "Laticinios",
  "Limpeza",
  "Massas",
  "Outros",
];

const UNIDADES = ["un", "kg", "g", "l", "ml", "cx", "pct"];

const emptyForm: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "organizationId"> = {
  nome: "",
  categoria: null,
  quantidade: 0,
  unidade: "un",
  precoUnitario: null,
  estoqueMinimo: null,
};

export default function Estoque() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.list();
      setItems([...data].sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error("Error fetching items:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar itens do estoque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: item.quantidade,
      unidade: item.unidade,
      precoUnitario: item.precoUnitario,
      estoqueMinimo: item.estoqueMinimo,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (item: InventoryItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do produto e obrigatorio",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria || undefined,
        quantidade: form.quantidade || 0,
        unidade: form.unidade || "un",
        precoUnitario: form.precoUnitario ?? undefined,
        estoqueMinimo: form.estoqueMinimo ?? undefined,
      };

      if (editingItem) {
        await inventoryService.update(editingItem.id, payload);
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso",
        });
      } else {
        await inventoryService.create(payload);
        toast({
          title: "Sucesso",
          description: "Produto cadastrado com sucesso",
        });
      }

      setIsDialogOpen(false);
      fetchItems();
    } catch (err) {
      console.error("Error saving item:", err);
      toast({
        title: "Erro",
        description: "Falha ao salvar produto",
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
      await inventoryService.delete(deletingItem.id);

      toast({
        title: "Sucesso",
        description: "Produto removido com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      toast({
        title: "Erro",
        description: "Falha ao remover produto",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.estoqueMinimo && item.quantidade <= item.estoqueMinimo) {
      return item.quantidade === 0 ? "critico" : "baixo";
    }
    return "normal";
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesCategoria =
      filterCategoria === "all" || item.categoria === filterCategoria;

    const status = getStockStatus(item);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "baixo" && (status === "baixo" || status === "critico")) ||
      (filterStatus === "normal" && status === "normal");

    return matchesSearch && matchesCategoria && matchesStatus;
  });

  const stats = {
    total: items.length,
    baixoEstoque: items.filter(
      (i) => i.estoqueMinimo && i.quantidade <= i.estoqueMinimo && i.quantidade > 0
    ).length,
    semEstoque: items.filter((i) => i.quantidade === 0).length,
    valorTotal: items.reduce(
      (sum, i) => sum + (i.precoUnitario || 0) * i.quantidade,
      0
    ),
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
              <Package className="h-8 w-8 text-primary" />
              Estoque
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus produtos e controle o estoque
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Total de Produtos</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            <p className="text-2xl font-bold text-amber-500">{stats.baixoEstoque}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Sem Estoque</p>
            <p className="text-2xl font-bold text-destructive">{stats.semEstoque}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Valor em Estoque</p>
            <p className="text-2xl font-bold text-success">
              R$ {stats.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {CATEGORIAS.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="normal">Estoque OK</SelectItem>
              <SelectItem value="baixo">Estoque Baixo</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto encontrado</p>
              <p className="text-sm mt-1">
                {items.length === 0
                  ? 'Clique em "Novo Produto" para adicionar'
                  : "Tente ajustar os filtros"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Preco Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item, index) => {
                    const status = getStockStatus(item);
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-border last:border-0"
                      >
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>
                          {item.categoria && (
                            <Badge variant="secondary">{item.categoria}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantidade} {item.unidade}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.precoUnitario
                            ? `R$ ${item.precoUnitario.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.precoUnitario
                            ? `R$ ${(item.precoUnitario * item.quantidade).toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 }
                              )}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              status === "normal" && "bg-success/10 text-success border-success/20",
                              status === "baixo" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                              status === "critico" && "bg-destructive/10 text-destructive border-destructive/20"
                            )}
                          >
                            {status === "normal" && "OK"}
                            {status === "baixo" && "Baixo"}
                            {status === "critico" && "Critico"}
                          </Badge>
                        </TableCell>
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
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize as informacoes do produto"
                : "Preencha os dados do novo produto"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Coca-Cola 350ml"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={form.categoria || ""}
                  onValueChange={(value) => setForm({ ...form, categoria: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Select
                  value={form.unidade}
                  onValueChange={(value) => setForm({ ...form, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((un) => (
                      <SelectItem key={un} value={un}>
                        {un}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantidade}
                  onChange={(e) =>
                    setForm({ ...form, quantidade: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estoque_minimo">Estoque Minimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estoqueMinimo || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estoqueMinimo: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="Alerta quando atingir"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preco_unitario">Preco Unitario (R$)</Label>
              <Input
                id="preco_unitario"
                type="number"
                min="0"
                step="0.01"
                value={form.precoUnitario || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    precoUnitario: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="0,00"
              />
            </div>
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
              Tem certeza que deseja excluir o produto "{deletingItem?.nome}"? Esta acao
              nao pode ser desfeita.
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
