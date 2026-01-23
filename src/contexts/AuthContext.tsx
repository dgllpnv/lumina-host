import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'super_admin' | 'admin' | 'staff';

interface Profile {
  id: string;
  organization_id: string | null;
  role: AppRole;
  nome: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Logger com timestamp
const log = (message: string, data?: any) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[AuthContext ${time}] ${message}`, data ?? '');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Função BLINDADA para buscar perfil
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    log('Iniciando fetch de perfil...', { userId });

    try {
      // MÉTODO 1: Tentar RPC get_my_profile (bypassa RLS)
      log('Tentando RPC get_my_profile...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile');

      if (!rpcError && rpcData) {
        log('RPC get_my_profile SUCESSO:', rpcData);
        return {
          id: rpcData.id,
          organization_id: rpcData.organization_id,
          role: (rpcData.role || 'staff') as AppRole,
          nome: rpcData.nome,
          avatar_url: rpcData.avatar_url,
          email: rpcData.email,
        };
      }

      log('RPC falhou, tentando fallback...', rpcError);

      // MÉTODO 2: Fallback - Query direta à tabela profiles
      log('Tentando query direta em profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        log('Query profiles FALHOU:', profileError);

        if (profileError.code === 'PGRST116') {
          log('ERRO CRÍTICO: Perfil não existe para usuário autenticado!');
          toast.error('Perfil não encontrado. Contate o administrador.');
          await supabase.auth.signOut();
          return null;
        }

        // Tentar buscar a role separadamente
        log('Tentando buscar role separadamente...');
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (roleData) {
          // Criar perfil básico com role encontrada
          const basicProfile: Profile = {
            id: userId,
            organization_id: null,
            role: (roleData.role || 'staff') as AppRole,
            nome: null,
            avatar_url: null,
            email: user?.email || null,
          };
          log('Perfil básico criado com role:', basicProfile);
          return basicProfile;
        }

        toast.error('Erro ao carregar perfil. Aplique o SQL de fix no Supabase.');
        return null;
      }

      // MÉTODO 3: Buscar role da tabela user_roles
      log('Profile encontrado, buscando role...');
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const finalRole = roleData?.role || profileData.role || 'staff';
      log('Role final determinada:', { roleFromUserRoles: roleData?.role, roleFromProfile: profileData.role, final: finalRole });

      const completeProfile: Profile = {
        id: profileData.id,
        organization_id: profileData.organization_id,
        role: finalRole as AppRole,
        nome: profileData.nome,
        avatar_url: profileData.avatar_url,
        email: profileData.email,
      };

      log('Perfil completo:', completeProfile);
      return completeProfile;

    } catch (error) {
      log('ERRO INESPERADO:', error);
      toast.error('Erro crítico ao carregar perfil.');
      return null;
    }
  }, [user?.email]);

  // Refresh manual do perfil
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      log('Refresh manual de perfil...');
      const newProfile = await fetchProfile(user.id);
      if (newProfile) {
        setProfile(newProfile);
        log('Perfil atualizado:', newProfile);
      }
    }
  }, [user?.id, fetchProfile]);

  // Handler de mudança de auth
  const handleAuthChange = useCallback(async (event: AuthChangeEvent, newSession: Session | null) => {
    log('Auth state change:', { event, hasSession: !!newSession });

    if (event === 'SIGNED_OUT' || !newSession?.user) {
      log('Usuário deslogado');
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setSession(newSession);
    setUser(newSession.user);

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      log('Sessão ativa, carregando perfil...');

      // Delay para garantir que trigger executou
      if (event === 'SIGNED_IN') {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const profileData = await fetchProfile(newSession.user.id);

      if (profileData) {
        setProfile(profileData);
        log('AUTH COMPLETO:', { userId: newSession.user.id, role: profileData.role });
      } else {
        // BLINDAGEM: Se perfil não carregou, FORÇAR LOGOUT
        log('BLINDAGEM: Perfil não carregado, forçando logout...');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    }
  }, [fetchProfile]);

  // Inicialização
  useEffect(() => {
    log('Inicializando AuthContext...');
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (mounted) {
              setTimeout(() => handleAuthChange(event, session), 0);
            }
          }
        );

        log('Verificando sessão existente...');
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();

        if (error) {
          log('Erro ao verificar sessão:', error);
          setLoading(false);
          return () => subscription.unsubscribe();
        }

        if (existingSession?.user) {
          log('Sessão existente encontrada:', { userId: existingSession.user.id });
          setSession(existingSession);
          setUser(existingSession.user);

          const profileData = await fetchProfile(existingSession.user.id);
          if (mounted) {
            if (profileData) {
              setProfile(profileData);
              log('Perfil carregado de sessão existente:', profileData);
            } else {
              // BLINDAGEM: Sem perfil = logout
              log('BLINDAGEM: Sessão sem perfil, deslogando...');
              await supabase.auth.signOut();
            }
          }
        } else {
          log('Nenhuma sessão existente');
        }

        if (mounted) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        log('Erro crítico na inicialização:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();
    return () => {
      mounted = false;
      cleanup.then(unsub => unsub?.());
    };
  }, [fetchProfile, handleAuthChange]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    log('Tentando login...', { email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        log('Erro no login:', error);
        return { error: error as Error };
      }

      log('Login bem-sucedido:', { userId: data.user?.id });
      return { error: null };
    } catch (error) {
      log('Erro inesperado no login:', error);
      return { error: error as Error };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, nome: string) => {
    log('Tentando cadastro...', { email, nome });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { nome },
        },
      });

      if (error) {
        log('Erro no cadastro:', error);
        return { error: error as Error };
      }

      log('Cadastro bem-sucedido:', { userId: data.user?.id });
      return { error: null };
    } catch (error) {
      log('Erro inesperado no cadastro:', error);
      return { error: error as Error };
    }
  };

  // Sign Out
  const signOut = async () => {
    log('Fazendo logout...');

    try {
      await supabase.auth.signOut();
      log('Logout bem-sucedido');
    } catch (error) {
      log('Erro no logout:', error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // Log de estado
  useEffect(() => {
    log('Estado atual:', {
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      role: profile?.role,
      isSuperAdmin,
      isAdmin,
    });
  }, [loading, user, profile, isSuperAdmin, isAdmin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
