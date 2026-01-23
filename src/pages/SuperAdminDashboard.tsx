import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { motion } from "framer-motion";
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Plus,
  MoreVertical,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const mockOrganizations = [
  { id: 1, nome: "Restaurante Sabor & Arte", tipo: "restaurante", plano: "Pro", status: "ativo", mrr: 299 },
  { id: 2, nome: "Pousada Recanto Verde", tipo: "pousada", plano: "Enterprise", status: "ativo", mrr: 599 },
  { id: 3, nome: "Bistrô da Praça", tipo: "restaurante", plano: "Basic", status: "pendente", mrr: 99 },
  { id: 4, nome: "Hotel Montanha Azul", tipo: "pousada", plano: "Pro", status: "ativo", mrr: 299 },
  { id: 5, nome: "Cantina Italiana", tipo: "restaurante", plano: "Pro", status: "inativo", mrr: 0 },
];

export default function SuperAdminDashboard() {
  const [open, setOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Painel Super Admin 🏢
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do SaaS Lumina Gestão
            </p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-glow">
                <Plus className="h-4 w-4 mr-2" />
                Nova Organização
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Organização</DialogTitle>
                <DialogDescription>
                  Adicione uma nova empresa ao sistema
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="org-nome">Nome da Empresa</Label>
                  <Input id="org-nome" placeholder="Ex: Restaurante Sabor & Arte" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-tipo">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurante">Restaurante</SelectItem>
                      <SelectItem value="pousada">Pousada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email do Admin</Label>
                  <Input id="admin-email" type="email" placeholder="admin@empresa.com" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    Criar Organização
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Empresas Ativas"
            value="48"
            change="+4 este mês"
            changeType="positive"
            icon={Building2}
            iconColor="bg-primary/10 text-primary"
            delay={0}
          />
          <KPICard
            title="MRR Total"
            value="R$ 24.650"
            change="+8% vs mês anterior"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-success/10 text-success"
            delay={0.1}
          />
          <KPICard
            title="Novos Cadastros"
            value="12"
            change="Últimos 30 dias"
            changeType="neutral"
            icon={TrendingUp}
            iconColor="bg-warning/10 text-warning"
            delay={0.2}
          />
        </div>

        {/* Organizations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">
              Organizações
            </h3>
            <p className="text-sm text-muted-foreground">
              Lista de todas as empresas cadastradas
            </p>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrganizations.map((org, index) => (
                <motion.tr
                  key={org.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className="group hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{org.nome}</TableCell>
                  <TableCell className="capitalize">{org.tipo}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{org.plano}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "capitalize",
                        org.status === "ativo" && "bg-success/10 text-success border-success/20",
                        org.status === "pendente" && "bg-warning/10 text-warning border-warning/20",
                        org.status === "inativo" && "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      {org.status === "ativo" && <Check className="h-3 w-3 mr-1" />}
                      {org.status === "inativo" && <X className="h-3 w-3 mr-1" />}
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {org.mrr}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </AppLayout>
  );
}
