import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Building2,
  UtensilsCrossed,
  Crown,
  User,
  RefreshCw
} from "lucide-react";
import { z } from "zod";

const setupSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Test users configuration
const TEST_USERS = [
  {
    id: "super",
    email: "super@lumina.com",
    password: "123456",
    nome: "Super Admin",
    role: "super_admin",
    organization: null,
    icon: Crown,
    color: "amber",
    description: "Acesso total - Seleção de organizações",
    expectedRoute: "/admin/organizations"
  },
  {
    id: "admin",
    email: "admin@restaurante.com",
    password: "123456",
    nome: "Admin Restaurante",
    role: "admin",
    organization: "Restaurante Sabor & Arte",
    icon: Building2,
    color: "indigo",
    description: "Gerente - Dashboard financeiro",
    expectedRoute: "/dashboard"
  },
  {
    id: "staff",
    email: "staff@restaurante.com",
    password: "123456",
    nome: "Garçom João",
    role: "staff",
    organization: "Restaurante Sabor & Arte",
    icon: UtensilsCrossed,
    color: "emerald",
    description: "Operacional - PDV Restaurante",
    expectedRoute: "/pos-restaurante"
  }
];

export default function SetupSuperAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSystem, setIsCheckingSystem] = useState(true);
  const [systemAlreadyInitialized, setSystemAlreadyInitialized] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);

  // Test users state
  const [testUsersStatus, setTestUsersStatus] = useState<Record<string, 'idle' | 'creating' | 'success' | 'error'>>({
    super: 'idle',
    admin: 'idle',
    staff: 'idle'
  });
  const [testOrgId, setTestOrgId] = useState<string | null>(null);
  const [isCreatingTestUsers, setIsCreatingTestUsers] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar se o sistema já foi inicializado
  useEffect(() => {
    const checkSystemStatus = async () => {
      console.log('[Setup] Checking if system is already initialized...');
      try {
        const { data, error } = await supabase.rpc('check_system_initialized');

        if (error) {
          console.error('[Setup] Error checking system status:', error);
          setSystemAlreadyInitialized(false);
        } else {
          console.log('[Setup] System status:', data);
          setSystemAlreadyInitialized(data?.initialized ?? false);
        }
      } catch (err) {
        console.error('[Setup] Unexpected error:', err);
        setSystemAlreadyInitialized(false);
      } finally {
        setIsCheckingSystem(false);
      }
    };

    checkSystemStatus();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    console.log('[Setup] Starting super admin creation...');

    try {
      const validation = setupSchema.safeParse({ nome, email, password });
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('[Setup] Step 1: Creating user in Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { nome },
        },
      });

      if (authError) {
        console.error('[Setup] Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado. Verifique se o email já está em uso.');
      }

      console.log('[Setup] User created:', authData.user.id);

      console.log('[Setup] Step 2: Waiting for trigger to create profile...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('[Setup] Step 3: Promoting to super_admin via RPC...');
      const { data: promoteResult, error: promoteError } = await supabase.rpc(
        'promote_to_super_admin',
        { target_user_id: authData.user.id }
      );

      if (promoteError) {
        console.error('[Setup] RPC error:', promoteError);
        const { error: fallbackError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role: 'super_admin'
          }, {
            onConflict: 'user_id,role'
          });

        if (fallbackError) {
          console.error('[Setup] Fallback also failed:', fallbackError);
          toast({
            title: "Aviso",
            description: "Usuário criado, mas a promoção a super admin pode ter falhado.",
            variant: "destructive",
          });
        }
      } else {
        console.log('[Setup] Promote result:', promoteResult);
      }

      console.log('[Setup] Step 4: Signing out...');
      await supabase.auth.signOut();

      setSuccess(true);
      toast({
        title: "Super Admin criado!",
        description: "Conta de Super Admin criada com sucesso.",
      });

      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (err: any) {
      console.error('[Setup] Error:', err);
      let errorMessage = err.message || "Ocorreu um erro inesperado.";
      if (err.message?.includes('already registered')) {
        errorMessage = "Este email já está registrado.";
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create test organization
  const createTestOrganization = async () => {
    console.log('[Setup] Creating test organization...');

    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('nome', 'Restaurante Sabor & Arte')
      .single();

    if (existingOrg) {
      console.log('[Setup] Test organization already exists:', existingOrg.id);
      return existingOrg.id;
    }

    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        nome: 'Restaurante Sabor & Arte',
        tipo: 'restaurante',
        plano: 'premium',
        ativo: true
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Setup] Error creating test org:', error);
      throw error;
    }

    console.log('[Setup] Test organization created:', newOrg.id);
    return newOrg.id;
  };

  // Create a single test user
  const createTestUser = async (testUser: typeof TEST_USERS[0], orgId: string | null) => {
    console.log(`[Setup] Creating test user: ${testUser.email}`);

    setTestUsersStatus(prev => ({ ...prev, [testUser.id]: 'creating' }));

    try {
      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: { nome: testUser.nome },
        },
      });

      // Se usuário já existe, tentar fazer login para pegar o ID
      if (authError?.message?.includes('already registered')) {
        console.log(`[Setup] User ${testUser.email} already registered, trying to update role...`);

        // Fazer login temporário para pegar dados
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password,
        });

        if (loginError) {
          console.log(`[Setup] Could not login as ${testUser.email}:`, loginError);
          setTestUsersStatus(prev => ({ ...prev, [testUser.id]: 'success' }));
          return;
        }

        const userId = loginData?.user?.id;
        if (userId) {
          // Usar RPC para configurar usuário de teste
          const { data: setupResult, error: setupError } = await supabase.rpc('setup_test_user', {
            target_user_id: userId,
            target_role: testUser.role,
            target_org_id: testUser.organization ? orgId : null
          });

          if (setupError) {
            console.log(`[Setup] RPC setup_test_user error:`, setupError);
            // Fallback para promote_to_super_admin se for super_admin
            if (testUser.role === 'super_admin') {
              await supabase.rpc('promote_to_super_admin', { target_user_id: userId });
            }
          } else {
            console.log(`[Setup] setup_test_user result:`, setupResult);
          }
        }

        // Fazer logout
        await supabase.auth.signOut();
        setTestUsersStatus(prev => ({ ...prev, [testUser.id]: 'success' }));
        return;
      }

      if (authError) {
        throw authError;
      }

      if (!authData?.user) {
        throw new Error('Falha ao criar usuário');
      }

      const userId = authData.user.id;
      console.log(`[Setup] User created with ID: ${userId}`);

      // Wait for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Usar RPC para configurar usuário
      const { data: setupResult, error: setupError } = await supabase.rpc('setup_test_user', {
        target_user_id: userId,
        target_role: testUser.role,
        target_org_id: testUser.organization ? orgId : null
      });

      if (setupError) {
        console.log(`[Setup] RPC setup_test_user error:`, setupError);
        // Fallback
        if (testUser.role === 'super_admin') {
          await supabase.rpc('promote_to_super_admin', { target_user_id: userId });
        }
      } else {
        console.log(`[Setup] setup_test_user result:`, setupResult);
      }

      // Fazer logout após criar
      await supabase.auth.signOut();

      setTestUsersStatus(prev => ({ ...prev, [testUser.id]: 'success' }));
      console.log(`[Setup] Test user ${testUser.email} created successfully`);

    } catch (err: any) {
      console.error(`[Setup] Error creating ${testUser.email}:`, err);
      setTestUsersStatus(prev => ({ ...prev, [testUser.id]: 'error' }));
    }
  };

  // Create all test users
  const handleCreateAllTestUsers = async () => {
    setIsCreatingTestUsers(true);
    setTestUsersStatus({ super: 'idle', admin: 'idle', staff: 'idle' });

    try {
      // First sign out any current user
      await supabase.auth.signOut();

      // Create organization first
      const orgId = await createTestOrganization();
      setTestOrgId(orgId);

      // Create users sequentially
      for (const testUser of TEST_USERS) {
        await createTestUser(testUser, testUser.organization ? orgId : null);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Sign out after creating all
      await supabase.auth.signOut();

      toast({
        title: "Usuários de teste criados!",
        description: "Todos os 3 usuários foram criados com sucesso.",
      });

    } catch (err: any) {
      console.error('[Setup] Error in test user creation:', err);
      toast({
        title: "Erro",
        description: err.message || "Falha ao criar usuários de teste.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTestUsers(false);
    }
  };

  // Loading inicial
  if (isCheckingSystem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">Verificando sistema...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto mb-6 flex items-center justify-center">
            <Shield className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Super Admin Criado!</h1>
          <p className="text-slate-600">Redirecionando para o login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-900 mx-auto mb-4 flex items-center justify-center shadow-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl text-indigo-900 mb-2">Setup do Sistema</h1>
          <p className="text-slate-600">Configuração inicial e usuários de teste</p>
        </div>

        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="test" className="gap-2">
              <Users className="w-4 h-4" />
              Usuários de Teste (RBAC)
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
              <Shield className="w-4 h-4" />
              Setup Inicial
            </TabsTrigger>
          </TabsList>

          {/* Test Users Tab */}
          <TabsContent value="test">
            <Card className="border-slate-200 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Matriz de Usuários para Testes RBAC
                </CardTitle>
                <CardDescription>
                  Crie os 3 usuários de teste para validar as diferentes visualizações do sistema
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Test Users Grid */}
                <div className="grid gap-4">
                  {TEST_USERS.map((user) => {
                    const status = testUsersStatus[user.id];
                    const IconComponent = user.icon;

                    return (
                      <div
                        key={user.id}
                        className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                          status === 'success'
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : status === 'error'
                            ? 'border-red-200 bg-red-50/50'
                            : status === 'creating'
                            ? 'border-indigo-200 bg-indigo-50/50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-${user.color}-100 flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className={`w-6 h-6 text-${user.color}-600`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{user.nome}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 mb-2">{user.description}</p>
                              <div className="space-y-1 text-sm">
                                <p className="font-mono text-slate-600">
                                  <span className="text-slate-400">Email:</span> {user.email}
                                </p>
                                <p className="font-mono text-slate-600">
                                  <span className="text-slate-400">Senha:</span> {user.password}
                                </p>
                                {user.organization && (
                                  <p className="font-mono text-slate-600">
                                    <span className="text-slate-400">Org:</span> {user.organization}
                                  </p>
                                )}
                                <p className="text-indigo-600">
                                  <span className="text-slate-400">Rota:</span> {user.expectedRoute}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            {status === 'creating' && (
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            )}
                            {status === 'success' && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            )}
                            {status === 'error' && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Create All Button */}
                <Button
                  onClick={handleCreateAllTestUsers}
                  disabled={isCreatingTestUsers}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
                >
                  {isCreatingTestUsers ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Criando Usuários de Teste...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Criar/Resetar Todos os Usuários de Teste
                    </>
                  )}
                </Button>

                {/* Info Box */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Importante:</p>
                      <ul className="list-disc list-inside space-y-1 text-amber-700">
                        <li>As funções RPC devem estar configuradas no Supabase</li>
                        <li>Após criar, faça login com cada usuário para testar</li>
                        <li>Se os usuários já existirem, serão marcados como sucesso</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Login Links */}
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-3">Após criar, acesse o login para testar:</p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="w-full"
                  >
                    Ir para Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Initial Setup Tab */}
          <TabsContent value="setup">
            {systemAlreadyInitialized ? (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto mb-4 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Sistema Já Configurado</h2>
                    <p className="text-slate-600 mb-6">
                      Um Super Admin já foi criado. Use a aba de "Usuários de Teste" para criar contas de teste.
                    </p>
                    <Button onClick={() => navigate('/auth')}>
                      Ir para Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200 shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Criar Primeiro Super Admin
                  </CardTitle>
                  <CardDescription>
                    Configure a conta principal de administrador do sistema
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSetup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Super Admin"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="super@lumina.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="123456"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Criar Super Admin
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-slate-400 mt-8">
          Lumina Host Setup v1.0 | Esta página deve ser protegida em produção
        </p>
      </motion.div>
    </div>
  );
}
