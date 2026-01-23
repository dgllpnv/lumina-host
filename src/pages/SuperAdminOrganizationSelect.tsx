import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  UtensilsCrossed, 
  Bed,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  nome: string;
  tipo: "restaurante" | "pousada";
  plano: string | null;
  ativo: boolean | null;
}

export default function SuperAdminOrganizationSelect() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("nome");

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectOrganization = (orgId: string) => {
    // Store selected organization and navigate to its dashboard
    localStorage.setItem("selectedOrgId", orgId);
    navigate(`/super-admin/org/${orgId}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <span className="font-bold text-lg text-foreground">Lumina</span>
              <span className="text-muted-foreground text-sm ml-2">Super Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/super-admin/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile?.nome?.charAt(0)?.toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{profile?.nome || "Super Admin"}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Selecione uma Organização
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha qual estabelecimento você deseja gerenciar. Você pode alternar entre eles a qualquer momento.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-10"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar organização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl"
            />
          </div>
        </motion.div>

        {/* Organizations Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 rounded-xl gradient-primary animate-pulse" />
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "Nenhuma organização encontrada" : "Nenhuma organização cadastrada"}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Vá em Configurações para adicionar uma nova organização
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrganizations.map((org, index) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card
                  className={cn(
                    "p-6 cursor-pointer transition-all duration-300 hover:shadow-elevated hover:border-primary/50 hover:-translate-y-1 group",
                    !org.ativo && "opacity-60"
                  )}
                  onClick={() => handleSelectOrganization(org.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      org.tipo === "restaurante" 
                        ? "bg-warning/10 text-warning" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {org.tipo === "restaurante" ? (
                        <UtensilsCrossed className="h-7 w-7" />
                      ) : (
                        <Bed className="h-7 w-7" />
                      )}
                    </div>
                    <Badge 
                      variant={org.ativo ? "default" : "secondary"}
                      className={cn(
                        org.ativo 
                          ? "bg-success/10 text-success border-success/20" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {org.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {org.nome}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground capitalize mb-4">
                    {org.tipo}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Badge variant="outline" className="text-xs">
                      {org.plano || "Basic"}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Ver dados</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="p-6 text-center">
            <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold text-foreground">{organizations.length}</p>
            <p className="text-sm text-muted-foreground">Organizações</p>
          </Card>
          <Card className="p-6 text-center">
            <UtensilsCrossed className="h-8 w-8 mx-auto text-warning mb-2" />
            <p className="text-3xl font-bold text-foreground">
              {organizations.filter(o => o.tipo === "restaurante").length}
            </p>
            <p className="text-sm text-muted-foreground">Restaurantes</p>
          </Card>
          <Card className="p-6 text-center">
            <Bed className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-3xl font-bold text-foreground">
              {organizations.filter(o => o.tipo === "pousada").length}
            </p>
            <p className="text-sm text-muted-foreground">Pousadas</p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
