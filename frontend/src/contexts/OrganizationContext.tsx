import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { organizationsService, setSelectedOrganization, getSelectedOrganization } from '@/services';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface Organization {
  id: string;
  nome: string;
  tipo: 'restaurante' | 'pousada';
  plano: string | null;
  ativo: boolean | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  activeOrganization: Organization | null;
  activeOrganizationId: string | null;
  organizations: Organization[];
  isLoading: boolean;
  setActiveOrganizationId: (id: string | null) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const STORAGE_KEY = 'lumina_selected_org_id';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isSuperAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrgIdState] = useState<string | null>(() => {
    // Inicializar do localStorage
    if (typeof window !== 'undefined') {
      return getSelectedOrganization();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Buscar organizações
  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      // Enquanto o AuthContext ainda está verificando o token (authLoading),
      // "sem usuário" pode ser só um estado transitório — não sinalizar
      // isLoading:false aqui, senão StaffRoute vê activeOrganization vazio
      // por um frame e redireciona antes do usuário real carregar.
      if (!authLoading) {
        setIsLoading(false);
      }
      return;
    }

    console.log('[OrganizationContext] Fetching organizations...');
    setIsLoading(true);

    try {
      const data = await organizationsService.list();
      console.log('[OrganizationContext] Found organizations:', data?.length);

      // Normalize the data to match the expected interface
      const normalizedOrgs: Organization[] = data.map(org => ({
        id: org.id,
        nome: org.nome,
        tipo: org.tipo,
        plano: org.plano,
        ativo: org.ativo,
        created_at: org.createdAt,
        updated_at: org.updatedAt,
      }));

      setOrganizations(normalizedOrgs);

      // Auto-select organization for non-super-admin users
      if (!isSuperAdmin && profile?.organization_id && !activeOrganizationId) {
        setActiveOrgIdState(profile.organization_id);
        setSelectedOrganization(profile.organization_id);
      }

      // If super admin and there's only one org, auto-select it
      if (isSuperAdmin && normalizedOrgs.length === 1 && !activeOrganizationId) {
        setActiveOrgIdState(normalizedOrgs[0].id);
        setSelectedOrganization(normalizedOrgs[0].id);
      }
    } catch (err) {
      console.error('[OrganizationContext] Error fetching organizations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile?.organization_id, isSuperAdmin, activeOrganizationId, authLoading]);

  // Buscar organizações quando usuário mudar
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Função para mudar organização ativa
  const setActiveOrganizationId = useCallback((id: string | null) => {
    console.log('[OrganizationContext] Setting active organization:', id);

    setActiveOrgIdState(id);
    setSelectedOrganization(id);

    // Invalidar todas as queries para recarregar dados com nova organização
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Organização ativa
  const activeOrganization = organizations.find(org => org.id === activeOrganizationId) || null;

  // Limpar ao fazer logout (só depois que a verificação inicial de auth terminou,
  // senão isso limpa a organização selecionada a cada reload, antes do login
  // assíncrono confirmar o usuário — ver AuthContext.loading)
  useEffect(() => {
    if (!authLoading && !user) {
      setActiveOrgIdState(null);
      setOrganizations([]);
      setSelectedOrganization(null);
    }
  }, [user, authLoading]);

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization,
        activeOrganizationId,
        organizations,
        isLoading,
        setActiveOrganizationId,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
