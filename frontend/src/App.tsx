import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrganizationProvider, useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";

// Pages
import Homepage from "./pages/Homepage";
import Auth from "./pages/Auth";
import SetupSuperAdmin from "./pages/SetupSuperAdmin";
import Dashboard from "./pages/Dashboard";
import AdminOrganizations from "./pages/AdminOrganizations";
import SuperAdminSettings from "./pages/SuperAdminSettings";
import POSRestaurante from "./pages/POSRestaurante";
import POSHotel from "./pages/POSHotel";
import Financeiro from "./pages/Financeiro";
import Equipe from "./pages/Equipe";
import Estoque from "./pages/Estoque";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Loading component reutilizável
function LoadingScreen({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  );
}

// ===========================
// ROTA: Apenas autenticados
// ===========================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  console.log('[ProtectedRoute]', { loading, hasUser: !!user, hasProfile: !!profile, role: profile?.role });

  if (loading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (!user || !profile) {
    console.log('[ProtectedRoute] Sem usuário ou perfil, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// ===========================
// ROTA: Apenas Super Admin
// ===========================
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isSuperAdmin } = useAuth();

  console.log('[SuperAdminRoute]', { loading, hasUser: !!user, role: profile?.role, isSuperAdmin });

  if (loading) {
    return <LoadingScreen message="Verificando permissões..." />;
  }

  if (!user || !profile) {
    console.log('[SuperAdminRoute] Sem autenticação, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  if (!isSuperAdmin) {
    console.log('[SuperAdminRoute] Não é super_admin, redirecionando para /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ===========================
// ROTA: Admin e Super Admin
// ===========================
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();

  console.log('[AdminRoute]', { loading, hasUser: !!user, role: profile?.role, isAdmin });

  if (loading) {
    return <LoadingScreen message="Verificando permissões..." />;
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    // Staff tentando acessar área administrativa -> PDV
    console.log('[AdminRoute] Staff tentando acessar admin, redirecionando para PDV');
    return <Navigate to="/pos-restaurante" replace />;
  }

  return <>{children}</>;
}

// ===========================
// ROTA: Staff (PDV) - Bloqueia acesso sem organização
// ===========================
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const { activeOrganization, isLoading: orgLoading } = useOrganization();

  console.log('[StaffRoute]', { loading, hasUser: !!user, role: profile?.role, hasOrg: !!activeOrganization });

  if (loading || orgLoading) {
    return <LoadingScreen message="Carregando PDV..." />;
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Super admin sem organização selecionada não pode acessar PDV
  if (isSuperAdmin && !activeOrganization) {
    console.log('[StaffRoute] Super admin sem org selecionada, redirecionando');
    return <Navigate to="/admin/organizations" replace />;
  }

  return <>{children}</>;
}

// ===========================
// COMPONENTE DE ROTAS
// ===========================
function AppRoutes() {
  return (
    <Routes>
      {/* ==================== ROTAS PÚBLICAS ==================== */}
      <Route path="/" element={<Homepage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/setup" element={<SetupSuperAdmin />} />

      {/* ==================== ROTAS SUPER ADMIN ==================== */}
      <Route
        path="/admin/organizations"
        element={
          <SuperAdminRoute>
            <AdminOrganizations />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <SuperAdminRoute>
            <SuperAdminSettings />
          </SuperAdminRoute>
        }
      />

      {/* ==================== ROTAS ADMIN (Admin + Super Admin) ==================== */}
      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <AdminRoute>
            <Financeiro />
          </AdminRoute>
        }
      />
      <Route
        path="/equipe"
        element={
          <AdminRoute>
            <Equipe />
          </AdminRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <AdminRoute>
            <Estoque />
          </AdminRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <AdminRoute>
            <Configuracoes />
          </AdminRoute>
        }
      />

      {/* ==================== ROTAS PDV (Todos autenticados) ==================== */}
      <Route
        path="/pos"
        element={
          <StaffRoute>
            <POSRestaurante />
          </StaffRoute>
        }
      />
      <Route
        path="/pos-restaurante"
        element={
          <StaffRoute>
            <POSRestaurante />
          </StaffRoute>
        }
      />
      <Route
        path="/pos-hotel"
        element={
          <StaffRoute>
            <POSHotel />
          </StaffRoute>
        }
      />

      {/* ==================== CATCH-ALL ==================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ===========================
// APP PRINCIPAL
// ===========================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <AppRoutes />
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
