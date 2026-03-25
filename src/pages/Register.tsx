import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, User, UserPlus, Loader2, Eye, EyeOff, Chrome, CheckCircle } from 'lucide-react';
import logoImg from '@/assets/Logo_Uhome.png';
import { getPasswordErrors, isPasswordStrong } from '@/lib/passwordValidation';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { register } = useAuth();
  const { toast } = useToast();

  const passwordErrors = password.length > 0 ? getPasswordErrors(password) : [];
  const passwordValid = isPasswordStrong(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (!passwordValid) {
      setError('A senha não atende aos requisitos de segurança.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast({
        title: 'E-mail já cadastrado',
        description: 'Este e-mail já possui uma conta na plataforma. Por favor, faça login ou recupere sua senha.',
        variant: 'destructive',
      });
      return;
    }

    if (error) {
      setError(error.message);
    } else {
      setRegisteredEmail(email);
      setSuccess(true);
    }
  };

  const handleResendEmail = async () => {
    if (!registeredEmail || isResending || cooldownSeconds > 0) return;

    setIsResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      });

      if (resendError) {
        toast({
          title: 'Erro ao reenviar e-mail',
          description: resendError.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'E-mail reenviado!',
        description: 'Verifique sua caixa de entrada e spam.',
      });
      setCooldownSeconds(60);
    } catch (resendError) {
      toast({
        title: 'Erro ao reenviar e-mail',
        description: resendError instanceof Error ? resendError.message : 'Não foi possível reenviar o e-mail.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (oauthError) {
      setError('Não foi possível iniciar o cadastro com Google.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <img src={logoImg} alt="Uhome" className="h-14 w-14 object-contain" />
            </div>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Conta Criada!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada (e o spam) para ativar sua conta antes de fazer login.
            </p>
            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Não recebeu o e-mail?</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={isResending || cooldownSeconds > 0 || !registeredEmail}
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Reenviando...
                  </>
                ) : cooldownSeconds > 0 ? (
                  `Reenviar e-mail em ${cooldownSeconds}s`
                ) : (
                  'Reenviar e-mail'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <img src={logoImg} alt="Uhome" className="h-14 w-14 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Criar Conta</CardTitle>
          <CardDescription>Cadastre-se e comece a buscar sua moradia</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="Seu nome" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mín. 8 chars, maiúscula, número e especial"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.length > 0 && (
                <ul className="text-sm text-destructive space-y-0.5 mt-1">
                  {passwordErrors.map((err) => (
                    <li key={err}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repita sua senha"
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-sm text-destructive">As senhas precisam ser idênticas.</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading || !passwordValid || !passwordsMatch}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Criar Conta
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2 bg-white text-slate-900 hover:bg-slate-100"
              size="lg"
              onClick={handleGoogleRegister}
            >
              <Chrome className="h-4 w-4" />
              Continuar com o Google
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
