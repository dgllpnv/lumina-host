import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Building2,
  ChevronLeft,
  LogOut,
  Wallet,
  Hotel,
  UtensilsCrossed,
  Globe,
  CalendarClock,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

// Tipo de organização, usado para filtrar os itens de menu abaixo.
// "restaurante" | "pousada" | "pousada_restaurante"
type OrgTipo = string | undefined;

// Cada item pode declarar `requiresTipo` — se a organização ativa não tiver
// um tipo compatível, o item some do menu (ver getModulesForTipo).
const adminMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "PDV Restaurante", url: "/pos-restaurante", icon: UtensilsCrossed, requiresTipo: ["restaurante", "pousada_restaurante"] },
  { title: "PDV Hotel", url: "/pos-hotel", icon: Hotel, requiresTipo: ["pousada", "pousada_restaurante"] },
  { title: "Site & Conteúdo", url: "/site-conteudo", icon: Globe, requiresTipo: ["pousada", "pousada_restaurante"] },
  { title: "Reservas externas", url: "/reservas-externas", icon: CalendarClock, requiresTipo: ["pousada", "pousada_restaurante"] },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Equipe", url: "/equipe", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

// Menu para Staff - acesso limitado apenas ao PDV
const staffMenuItems = [
  { title: "PDV Restaurante", url: "/pos-restaurante", icon: UtensilsCrossed, requiresTipo: ["restaurante", "pousada_restaurante"] },
  { title: "PDV Hotel", url: "/pos-hotel", icon: Hotel, requiresTipo: ["pousada", "pousada_restaurante"] },
];

// Filtra os itens de um menu pelo tipo da organização ativa. Itens sem
// `requiresTipo` sempre aparecem; um super admin sem organização selecionada
// não usa essas listas (ver getMenuItems), então `tipo` undefined aqui só
// acontece num instante transitório de carregamento.
function getModulesForTipo<T extends { requiresTipo?: string[] }>(items: T[], tipo: OrgTipo): T[] {
  return items.filter(item => !item.requiresTipo || (tipo && item.requiresTipo.includes(tipo)));
}

// Menu para Super Admin - gestão global do SaaS
const superAdminMenuItems = [
  { title: "Painel Global", url: "/super-admin", icon: Building2 },
  { title: "Configurações", url: "/super-admin/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut, isSuperAdmin, isAdmin } = useAuth();
  const { activeOrganization } = useOrganization();
  const location = useLocation();

  // Determina o menu baseado no role do usuário e no tipo da organização ativa.
  // Super admin "gerenciando" uma organização (activeOrganization setada ao
  // clicar em "Gerenciar" na lista de organizações) precisa ver o mesmo menu
  // operacional de um admin comum — senão fica sem UI pra operar nada além do
  // Dashboard. Sem organização selecionada, continua vendo só o painel global.
  const getMenuItems = () => {
    const tipo = activeOrganization?.tipo;
    if (isSuperAdmin) {
      if (!activeOrganization) return superAdminMenuItems;
      return [
        ...getModulesForTipo(adminMenuItems, tipo),
        { title: "Painel Global", url: "/super-admin", icon: Building2 },
      ];
    }
    if (isAdmin) return getModulesForTipo(adminMenuItems, tipo);
    return getModulesForTipo(staffMenuItems, tipo); // Staff só vê PDV
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="min-h-screen h-full bg-sidebar flex flex-col border-r border-sidebar-border sticky top-0"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">Lumina</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>

      {/* Organization Indicator */}
      {activeOrganization && (
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-b border-sidebar-border bg-sidebar-accent/30"
            >
              <p className="text-xs text-muted-foreground">Gerenciando</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {activeOrganization.nome}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "hover:bg-sidebar-accent group",
              isActive(item.url)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                : "text-sidebar-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 shrink-0",
              isActive(item.url) ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
            )} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg",
          collapsed ? "justify-center" : ""
        )}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm">
              {profile?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : 'Staff'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent shrink-0",
              collapsed ? "hidden" : ""
            )}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
