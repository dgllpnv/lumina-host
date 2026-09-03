import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect baseado na role (RBAC)
  useEffect(() => {
    const handleRedirect = async () => {
      if (!authLoading && user && profile) {
        console.log('[Auth Page] User authenticated, redirecting...', { role: profile.role });

        switch (profile.role) {
          case 'super_admin':
            // Super Admin vai para seleção de organizações
            navigate('/admin/organizations', { replace: true });
            break;

          case 'admin':
            // Admin vai direto para o dashboard da sua organização
            navigate('/dashboard', { replace: true });
            break;

          case 'staff':
            // Staff vai para o PDV correspondente ao tipo da organização
            // O tipo da organização vem junto com o user da API
            if (user && 'organization' in user && user.organization?.tipo === 'pousada') {
              navigate('/pos-hotel', { replace: true });
            } else {
              navigate('/pos-restaurante', { replace: true });
            }
            break;

          default:
            navigate('/dashboard', { replace: true });
        }
      }
    };

    handleRedirect();
  }, [user, profile, authLoading, navigate]);

  // Se ainda está carregando auth, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary animate-pulse-soft" />
          <p className="text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir duplo clique
    if (isLoading) return;

    setIsLoading(true);
    console.log('[Auth Page] Login attempt started...');

    try {
      // Validação dos campos
      const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Tentar login
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        console.log('[Auth Page] Login error:', error.message);

        // Mapear mensagens de erro para português
        let errorMessage = error.message;
        if (error.message === "Invalid login credentials" || error.message === "Invalid credentials") {
          errorMessage = "Email ou senha incorretos";
        } else if (error.message === "Email and password are required") {
          errorMessage = "Preencha email e senha";
        } else if (error.message === "Login failed") {
          errorMessage = "Falha ao entrar. Tente novamente.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email não confirmado. Verifique sua caixa de entrada.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
        }

        toast({
          title: "Erro ao entrar",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        console.log('[Auth Page] Login successful, waiting for auth state update...');
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso.",
        });
        // Não setar isLoading(false) aqui - o redirect vai acontecer via useEffect
        // quando o profile for carregado
      }
    } catch (err) {
      console.error('[Auth Page] Unexpected error:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Voltar ao início</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Lumina Host</h1>
          <p className="text-slate-500 mt-1">Acesse sua conta</p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-900/5 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-slate-900">Entrar no Sistema</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para continuar
            </CardDescription>
          </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          © 2026 Lumina Host. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
}
