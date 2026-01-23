import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

const STORAGE_KEY = 'lumina_active_org_id';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrgIdState] = useState<string | null>(() => {
    // Inicializar do localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Buscar organizações
  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setIsLoading(false);
      return;
    }

    console.log('[OrganizationContext] Fetching organizations...');
    setIsLoading(true);

    try {
      if (isSuperAdmin) {
        // Super Admin vê todas as organizações
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('nome');

        if (error) {
          console.error('[OrganizationContext] Error fetching orgs:', error);
        } else {
          console.log('[OrganizationContext] Found organizations:', data?.length);
          setOrganizations(data || []);
        }
      } else if (profile?.organization_id) {
        // Admin/Staff vê apenas sua organização
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (error) {
          console.error('[OrganizationContext] Error fetching org:', error);
        } else if (data) {
          setOrganizations([data]);
          // Auto-selecionar a organização do usuário
          if (!activeOrganizationId) {
            setActiveOrgIdState(data.id);
            localStorage.setItem(STORAGE_KEY, data.id);
          }
        }
      }
    } catch (err) {
      console.error('[OrganizationContext] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile?.organization_id, isSuperAdmin, activeOrganizationId]);

  // Buscar organizações quando usuário mudar
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Função para mudar organização ativa
  const setActiveOrganizationId = useCallback((id: string | null) => {
    console.log('[OrganizationContext] Setting active organization:', id);

    setActiveOrgIdState(id);

    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    // Invalidar todas as queries para recarregar dados com nova organização
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Organização ativa
  const activeOrganization = organizations.find(org => org.id === activeOrganizationId) || null;

  // Limpar ao fazer logout
  useEffect(() => {
    if (!user) {
      setActiveOrgIdState(null);
      setOrganizations([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

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
