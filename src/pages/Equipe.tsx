import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Mail,
  MoreVertical,
  UserPlus,
  Shield,
  User,
  Crown,
  Loader2,
  Edit2,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface TeamMember {
  id: string;
  nome: string | null;
  email: string | null;
  role: AppRole;
  avatar_url: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function Equipe() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", role: "staff" as AppRole });
  const [newUserForm, setNewUserForm] = useState({
    nome: "",
    email: "",
    senha: "",
    role: "staff" as AppRole,
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTeam();
    }
  }, [profile?.organization_id]);

  const fetchTeam = async () => {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("nome");

      if (error) throw error;
      setTeam(data || []);
    } catch (err) {
      console.error("Error fetching team:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar equipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({
      nome: member.nome || "",
      role: member.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: editForm.nome.trim() || null,
          role: editForm.role,
        })
        .eq("id", editingMember.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Colaborador atualizado com sucesso",
      });
      setIsEditDialogOpen(false);
      fetchTeam();
    } catch (err) {
      console.error("Error updating member:", err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar colaborador",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.nome.trim() || !newUserForm.email.trim() || !newUserForm.senha.trim()) {
      toast({
        title: "Erro",
        description: "Nome, email e senha sao obrigatorios",
        variant: "destructive",
      });
      return;
    }

    if (newUserForm.senha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("admin_create_user", {
        p_email: newUserForm.email.trim(),
        p_password: newUserForm.senha,
        p_nome: newUserForm.nome.trim(),
        p_role: newUserForm.role,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || "Erro ao criar usuario");
      }

      toast({
        title: "Sucesso",
        description: "Colaborador criado com sucesso",
      });

      setIsCreateDialogOpen(false);
      setNewUserForm({ nome: "", email: "", senha: "", role: "staff" });
      fetchTeam();
    } catch (err) {
      console.error("Error creating user:", err);
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao criar colaborador",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Administrador";
      case "staff":
        return "Colaborador";
      default:
        return role;
    }
  };

  const getRoleColor = (role: AppRole) => {
    switch (role) {
      case "super_admin":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "admin":
        return "bg-primary/10 text-primary border-primary/20";
      case "staff":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-3 w-3 mr-1" />;
      case "admin":
        return <Shield className="h-3 w-3 mr-1" />;
      case "staff":
        return <User className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const filteredTeam = team.filter((member) => {
    const matchesSearch =
      (member.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesRole = filterRole === "all" || member.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: team.length,
    admins: team.filter((m) => m.role === "admin" || m.role === "super_admin").length,
    staff: team.filter((m) => m.role === "staff").length,
  };

  const canEditRole = (member: TeamMember) => {
    if (!profile) return false;
    if (profile.role === "super_admin") return true;
    if (profile.role === "admin" && member.role !== "super_admin" && member.id !== profile.id) return true;
    return false;
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Equipe
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os colaboradores da sua organizacao
            </p>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Colaborador
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Administradores</p>
            <p className="text-2xl font-bold text-primary">{stats.admins}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground">Colaboradores</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.staff}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por funcao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Funcoes</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="staff">Colaborador</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Team Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTeam.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
            {team.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Novo Colaborador" para adicionar membros
              </p>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTeam.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="p-6 transition-all hover:shadow-soft hover:border-primary/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {(member.nome || member.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {member.nome || "Sem nome"}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("mt-1", getRoleColor(member.role))}
                          >
                            {getRoleIcon(member.role)}
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                      </div>

                      {canEditRole(member) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email || "Sem email"}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Desde {new Date(member.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      {member.id === profile?.id && (
                        <Badge variant="outline" className="text-xs">
                          Voce
                        </Badge>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
            <DialogDescription>
              Atualize as informacoes do colaborador
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                placeholder="Nome do colaborador"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role">Funcao</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value as AppRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profile?.role === "super_admin" && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="staff">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Novo Colaborador</DialogTitle>
            <DialogDescription>
              Crie um novo colaborador com acesso direto ao sistema
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-nome">Nome *</Label>
              <Input
                id="new-nome"
                value={newUserForm.nome}
                onChange={(e) => setNewUserForm({ ...newUserForm, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-email">Email *</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-senha">Senha *</Label>
              <Input
                id="new-senha"
                type="password"
                value={newUserForm.senha}
                onChange={(e) => setNewUserForm({ ...newUserForm, senha: e.target.value })}
                placeholder="Minimo 6 caracteres"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-role">Funcao</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value as AppRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="staff">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Colaborador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
