import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, User, tokenStorage } from '@/services';
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

// Convert API User to Profile
const userToProfile = (user: User): Profile => ({
  id: user.id,
  organization_id: user.organizationId,
  role: user.role,
  nome: user.nome,
  avatar_url: user.avatarUrl || null,
  email: user.email,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = useCallback(async (): Promise<User | null> => {
    log('Fetching user profile...');

    try {
      const userData = await authService.getMe();
      log('Profile fetched successfully:', userData);
      return userData;
    } catch (error: any) {
      log('Error fetching profile:', error);

      if (error.response?.status === 401) {
        // Token expired or invalid
        tokenStorage.clearTokens();
        return null;
      }

      return null;
    }
  }, []);

  // Refresh manual do perfil
  const refreshProfile = useCallback(async () => {
    log('Refreshing profile...');
    const userData = await fetchProfile();
    if (userData) {
      setUser(userData);
      setProfile(userToProfile(userData));
      log('Profile refreshed:', userData);
    }
  }, [fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    log('Initializing AuthContext...');
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const token = tokenStorage.getAccessToken();

        if (!token) {
          log('No token found');
          setLoading(false);
          return;
        }

        log('Token found, verifying...');
        const userData = await fetchProfile();

        if (mounted) {
          if (userData) {
            setUser(userData);
            setProfile(userToProfile(userData));
            log('Auth initialized:', userData);
          } else {
            log('Invalid token, clearing...');
            tokenStorage.clearTokens();
          }
          setLoading(false);
        }
      } catch (error) {
        log('Error initializing auth:', error);
        if (mounted) {
          tokenStorage.clearTokens();
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for logout events (from API interceptor)
    const handleLogout = () => {
      log('Logout event received');
      setUser(null);
      setProfile(null);
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      mounted = false;
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [fetchProfile]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    log('Attempting login...', { email });

    try {
      const response = await authService.login(email, password);

      setUser(response.user);
      setProfile(userToProfile(response.user));

      log('Login successful:', { userId: response.user.id, role: response.user.role });
      return { error: null };
    } catch (error: any) {
      log('Login error:', error);

      const message = error.response?.data?.error || 'Erro ao fazer login';
      return { error: new Error(message) };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, nome: string) => {
    log('Attempting registration...', { email, nome });

    try {
      const response = await authService.register(email, password, nome);

      setUser(response.user);
      setProfile(userToProfile(response.user));

      log('Registration successful:', { userId: response.user.id });
      return { error: null };
    } catch (error: any) {
      log('Registration error:', error);

      const message = error.response?.data?.error || 'Erro ao criar conta';
      return { error: new Error(message) };
    }
  };

  // Sign Out
  const signOut = async () => {
    log('Signing out...');

    try {
      await authService.logout();
      log('Logout successful');
    } catch (error) {
      log('Logout error (ignoring):', error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // Log state changes
  useEffect(() => {
    log('Current state:', {
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
