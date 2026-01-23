import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  UtensilsCrossed,
  Hotel,
  Search,
  Plus,
  Settings,
  LogOut,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function AdminOrganizations() {
  const navigate = useNavigate();
  const { profile, signOut, isSuperAdmin } = useAuth();
  const { organizations, setActiveOrganizationId, isLoading, refreshOrganizations } = useOrganization();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState<"restaurante" | "pousada">("restaurante");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Redirect se não for super admin
  useEffect(() => {
    if (!isSuperAdmin && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSuperAdmin, profile, navigate]);

  // Filtrar organizações
  const filteredOrganizations = organizations.filter(org =>
    org.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selecionar organização e redirecionar
  const handleSelectOrganization = (orgId: string) => {
    console.log('[AdminOrganizations] Selecting organization:', orgId);
    setActiveOrganizationId(orgId);
    navigate('/dashboard');
  };

  // Criar nova organização
  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da organização é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          nome: newOrgName.trim(),
          tipo: newOrgType,
          plano: 'basic',
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Organização criada!",
        description: `${newOrgName} foi criada com sucesso.`,
      });

      setDialogOpen(false);
      setNewOrgName("");
      setNewOrgType("restaurante");
      await refreshOrganizations();

    } catch (err: any) {
      console.error('[AdminOrganizations] Error creating org:', err);
      toast({
        title: "Erro ao criar",
        description: err.message || "Não foi possível criar a organização.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">Carregando organizações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-slate-800">Lumina Host</span>
              <Badge variant="outline" className="ml-2 text-xs">Super Admin</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Organizações</h1>
              <p className="text-slate-600 mt-1">
                Gerencie todas as empresas cadastradas na plataforma
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Organização
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Organização</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova empresa cliente à plataforma.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nome da Organização</Label>
                    <Input
                      id="org-name"
                      placeholder="Ex: Restaurante Bella Vista"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-type">Tipo</Label>
                    <Select value={newOrgType} onValueChange={(v: "restaurante" | "pousada") => setNewOrgType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurante">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="w-4 h-4" />
                            Restaurante
                          </div>
                        </SelectItem>
                        <SelectItem value="pousada">
                          <div className="flex items-center gap-2">
                            <Hotel className="w-4 h-4" />
                            Pousada / Hotel
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleCreateOrganization}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Organização"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar organizações..."
              className="pl-10 h-11 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: organizations.length, icon: Building2 },
              { label: "Restaurantes", value: organizations.filter(o => o.tipo === 'restaurante').length, icon: UtensilsCrossed },
              { label: "Pousadas", value: organizations.filter(o => o.tipo === 'pousada').length, icon: Hotel },
              { label: "Ativos", value: organizations.filter(o => o.ativo).length, icon: Users },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Organizations Grid */}
          {filteredOrganizations.length === 0 ? (
            <Card className="p-12 text-center bg-white">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Nenhuma organização encontrada
              </h3>
              <p className="text-slate-500 mb-6">
                {searchQuery
                  ? "Tente buscar com outros termos"
                  : "Crie a primeira organização para começar"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Organização
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredOrganizations.map((org, index) => (
                  <motion.div
                    key={org.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden bg-white hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300 group">
                      {/* Header Image */}
                      <div className="h-32 relative overflow-hidden">
                        <img
                          src={org.tipo === 'restaurante'
                            ? "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80"
                            : "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80"
                          }
                          alt={org.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <Badge
                            variant="secondary"
                            className={`${org.tipo === 'restaurante'
                              ? 'bg-orange-500/90 text-white'
                              : 'bg-blue-500/90 text-white'
                            }`}
                          >
                            {org.tipo === 'restaurante' ? (
                              <><UtensilsCrossed className="w-3 h-3 mr-1" /> Restaurante</>
                            ) : (
                              <><Hotel className="w-3 h-3 mr-1" /> Pousada</>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">
                          {org.nome}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant={org.ativo ? "default" : "secondary"} className="text-xs">
                            {org.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Plano {org.plano || 'Basic'}
                          </span>
                        </div>

                        <Button
                          className="w-full bg-slate-900 hover:bg-slate-800"
                          onClick={() => handleSelectOrganization(org.id)}
                        >
                          Gerenciar
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
