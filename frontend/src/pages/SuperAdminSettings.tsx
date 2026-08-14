import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Building2, 
  Plus,
  Settings,
  Users,
  CreditCard,
  Check,
  X,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const mockOrganizations = [
  { id: "1", nome: "Restaurante Sabor & Arte", tipo: "restaurante", plano: "Pro", status: "ativo", mrr: 299, adminEmail: "admin@saborearte.com" },
  { id: "2", nome: "Pousada Recanto Verde", tipo: "pousada", plano: "Enterprise", status: "ativo", mrr: 599, adminEmail: "admin@recantoverde.com" },
  { id: "3", nome: "Bistrô da Praça", tipo: "restaurante", plano: "Basic", status: "pendente", mrr: 99, adminEmail: "admin@bistropraca.com" },
  { id: "4", nome: "Hotel Montanha Azul", tipo: "pousada", plano: "Pro", status: "ativo", mrr: 299, adminEmail: "admin@montanhaazul.com" },
  { id: "5", nome: "Cantina Italiana", tipo: "restaurante", plano: "Pro", status: "inativo", mrr: 0, adminEmail: "admin@cantina.com" },
];

export default function SuperAdminSettings() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/super-admin")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento do sistema</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organizações
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Faturamento
            </TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center"
            >
              <div>
                <h2 className="text-2xl font-bold">Organizações</h2>
                <p className="text-muted-foreground">Gerencie todas as empresas do sistema</p>
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
                          <SelectItem value="pousada">Pousada / Hotel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-plano">Plano</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic - R$ 99/mês</SelectItem>
                          <SelectItem value="pro">Pro - R$ 299/mês</SelectItem>
                          <SelectItem value="enterprise">Enterprise - R$ 599/mês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email do Admin</Label>
                      <Input id="admin-email" type="email" placeholder="admin@empresa.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-senha">Senha do Admin</Label>
                      <Input id="admin-senha" type="password" placeholder="Senha inicial" />
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin</TableHead>
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
                      <TableCell className="text-muted-foreground text-sm">
                        {org.adminEmail}
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold">Usuários</h2>
              <p className="text-muted-foreground">Gerencie usuários administrativos do sistema</p>
            </motion.div>
            
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Gerenciamento de usuários em breve</p>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold">Faturamento</h2>
              <p className="text-muted-foreground">Visualize métricas financeiras do SaaS</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">MRR Total</p>
                <p className="text-3xl font-bold text-foreground">R$ 24.650</p>
                <p className="text-sm text-success mt-2">+8% vs mês anterior</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Clientes Ativos</p>
                <p className="text-3xl font-bold text-foreground">48</p>
                <p className="text-sm text-success mt-2">+4 este mês</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Churn Rate</p>
                <p className="text-3xl font-bold text-foreground">2.1%</p>
                <p className="text-sm text-muted-foreground mt-2">Meta: &lt;3%</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
