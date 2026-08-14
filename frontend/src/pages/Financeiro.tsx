import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { transactionsService, type Transaction } from "@/services";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Download,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TransactionType = Transaction["tipo"];
type TransactionStatus = Transaction["status"];

const CATEGORIAS = [
  "Vendas",
  "Insumos",
  "Pessoal",
  "Manutencao",
  "Operacional",
  "Eventos",
  "Outros",
];

const emptyForm = {
  descricao: "",
  valor: 0,
  tipo: "receita" as TransactionType,
  categoria: "Vendas",
  status: "pendente" as TransactionStatus,
  dataVencimento: "",
};

export default function Financeiro() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await transactionsService.list({ limit: 500 });
      setTransactions(
        [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar transacoes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim() || form.valor <= 0) {
      toast({
        title: "Erro",
        description: "Descricao e valor sao obrigatorios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await transactionsService.create({
        descricao: form.descricao.trim(),
        valor: form.valor,
        tipo: form.tipo,
        categoria: form.categoria,
        status: form.status,
        dataVencimento: form.dataVencimento || undefined,
      });

      toast({
        title: "Sucesso",
        description: "Transacao registrada com sucesso",
      });
      setIsDialogOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error("Error saving transaction:", err);
      toast({
        title: "Erro",
        description: "Falha ao salvar transacao",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsPaid = async (transaction: Transaction) => {
    setSaving(true);
    try {
      await transactionsService.update(transaction.id, {
        status: "pago",
        dataPagamento: new Date().toISOString(),
      });

      toast({
        title: "Sucesso",
        description: "Transacao marcada como paga",
      });
      fetchTransactions();
    } catch (err) {
      console.error("Error updating transaction:", err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar transacao",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhuma transacao para exportar",
      });
      return;
    }

    const headers = [
      "Data",
      "Descricao",
      "Tipo",
      "Categoria",
      "Status",
      "Valor",
      "Data Pagamento",
    ];

    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString("pt-BR"),
      t.descricao || "",
      t.tipo === "receita" ? "Receita" : "Despesa",
      t.categoria,
      t.status.charAt(0).toUpperCase() + t.status.slice(1),
      t.valor.toFixed(2).replace(".", ","),
      t.dataPagamento
        ? new Date(t.dataPagamento).toLocaleDateString("pt-BR")
        : "",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `financeiro_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatorio exportado com sucesso",
    });
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case "pago":
        return <Check className="h-3 w-3" />;
      case "pendente":
        return <Clock className="h-3 w-3" />;
      case "atrasado":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "pago":
        return "bg-success/10 text-success border-success/20";
      case "pendente":
        return "bg-warning/10 text-warning border-warning/20";
      case "atrasado":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "cancelado":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria =
      filterCategoria === "all" || t.categoria === filterCategoria;

    const matchesStatus = filterStatus === "all" || t.status === filterStatus;

    return matchesSearch && matchesCategoria && matchesStatus;
  });

  const contasAPagar = transactions.filter(
    (t) => t.tipo === "despesa" && t.status !== "pago" && t.status !== "cancelado"
  );
  const contasAReceber = transactions.filter(
    (t) => t.tipo === "receita" && t.status !== "pago" && t.status !== "cancelado"
  );

  const totais = {
    receitas: transactions
      .filter((t) => t.tipo === "receita" && t.status === "pago")
      .reduce((sum, t) => sum + t.valor, 0),
    despesas: transactions
      .filter((t) => t.tipo === "despesa" && t.status === "pago")
      .reduce((sum, t) => sum + t.valor, 0),
  };
  const saldo = totais.receitas - totais.despesas;

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
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas financas e fluxo de caixa
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Transacao
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Total Receitas</p>
            <p className="text-2xl font-bold text-success">
              R$ {totais.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Total Despesas</p>
            <p className="text-2xl font-bold text-destructive">
              R$ {totais.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p
              className={cn(
                "text-2xl font-bold",
                saldo >= 0 ? "text-success" : "text-destructive"
              )}
            >
              R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Tabs defaultValue="movimentacoes" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="movimentacoes">Movimentacoes</TabsTrigger>
              <TabsTrigger value="pagar">
                Contas a Pagar
                {contasAPagar.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {contasAPagar.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="receber">
                Contas a Receber
                {contasAReceber.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {contasAReceber.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="movimentacoes">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar transacoes..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma transacao encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-20">Acao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredTransactions.map((transaction, index) => (
                          <motion.tr
                            key={transaction.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3, delay: 0.02 * index }}
                            className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                          >
                            <TableCell>
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center",
                                  transaction.tipo === "receita"
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                                )}
                              >
                                {transaction.tipo === "receita" ? (
                                  <ArrowUpRight className="h-4 w-4" />
                                ) : (
                                  <ArrowDownLeft className="h-4 w-4" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.descricao || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{transaction.categoria}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "capitalize gap-1",
                                  getStatusColor(transaction.status)
                                )}
                              >
                                {getStatusIcon(transaction.status)}
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={cn(
                                  "font-semibold",
                                  transaction.tipo === "receita"
                                    ? "text-success"
                                    : "text-destructive"
                                )}
                              >
                                {transaction.tipo === "receita" ? "+" : "-"} R${" "}
                                {transaction.valor.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </TableCell>
                            <TableCell>
                              {transaction.status !== "pago" &&
                                transaction.status !== "cancelado" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleMarkAsPaid(transaction)}
                                    disabled={saving}
                                  >
                                    Baixar
                                  </Button>
                                )}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pagar">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <h3 className="text-lg font-semibold mb-4">Contas a Pagar</h3>
                {contasAPagar.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma conta pendente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contasAPagar.map((conta) => (
                      <div
                        key={conta.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium">{conta.descricao || "-"}</p>
                          <p className="text-sm text-muted-foreground">
                            {conta.dataVencimento
                              ? `Vencimento: ${new Date(
                                  conta.dataVencimento
                                ).toLocaleDateString("pt-BR")}`
                              : `Criado em: ${new Date(
                                  conta.createdAt
                                ).toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge
                            className={cn(
                              "capitalize gap-1",
                              getStatusColor(conta.status)
                            )}
                          >
                            {getStatusIcon(conta.status)}
                            {conta.status}
                          </Badge>
                          <span className="font-semibold text-destructive">
                            R${" "}
                            {conta.valor.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(conta)}
                            disabled={saving}
                          >
                            Pagar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="receber">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <h3 className="text-lg font-semibold mb-4">Contas a Receber</h3>
                {contasAReceber.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma conta a receber
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contasAReceber.map((conta) => (
                      <div
                        key={conta.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium">{conta.descricao || "-"}</p>
                          <p className="text-sm text-muted-foreground">
                            {conta.dataVencimento
                              ? `Vencimento: ${new Date(
                                  conta.dataVencimento
                                ).toLocaleDateString("pt-BR")}`
                              : `Criado em: ${new Date(
                                  conta.createdAt
                                ).toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-success">
                            R${" "}
                            {conta.valor.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(conta)}
                            disabled={saving}
                          >
                            Receber
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Transacao</DialogTitle>
            <DialogDescription>Registre uma nova movimentacao financeira</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descricao *</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Venda Mesa 5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(value) =>
                    setForm({ ...form, tipo: value as TransactionType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(value) => setForm({ ...form, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor || ""}
                  onChange={(e) =>
                    setForm({ ...form, valor: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as TransactionStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="data_vencimento">Data de Vencimento</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={form.dataVencimento}
                onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
