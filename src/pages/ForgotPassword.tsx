import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/Logo_Uhome.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    toast({
      title: 'Link enviado!',
      description: `Verifique sua caixa de entrada em ${email}`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <img src={logoImg} alt="Uhome" className="h-14 w-14 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Recuperar Senha</CardTitle>
          <CardDescription>
            {sent
              ? 'Verifique seu e-mail para redefinir a senha'
              : 'Digite seu e-mail para receber o link de recuperação'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" size="lg">
                <Send className="h-4 w-4" />
                Enviar link de recuperação
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enviamos um link para <strong>{email}</strong>. Verifique também a pasta de spam.
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
