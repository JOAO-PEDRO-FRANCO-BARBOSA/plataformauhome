import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { HabitBadges } from '@/components/HabitBadges';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, Trash2, Check, Mail, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { profile, updateProfile, isSaving } = useProfile();
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateHabit = (key: string, value: any) => {
    updateProfile({ habits: { ...profile.habits, [key]: value } });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}`;
      const { error } = await supabase.storage.from('property-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('property-images').getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
      await refreshProfile();
      toast.success('Foto de perfil atualizada! 📸');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer upload');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleMatchPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/match-photo-${Date.now()}`;
    const { error } = await supabase.storage.from('property-images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('property-images').getPublicUrl(path);
      await updateProfile({ match_photo_url: data.publicUrl });
      toast.success('Foto de match atualizada! 📸');
    } else {
      toast.error('Erro ao fazer upload');
    }
    setUploading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const res = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message || 'Erro ao excluir conta');
      
      await logout();
      navigate('/login');
      toast.success('Conta excluída com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir conta');
    } finally {
      setDeleting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error('Não foi possível identificar o e-mail da conta.');
      return;
    }

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Enviamos um link de redefinição para o seu e-mail');
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível enviar o link de redefinição.');
    } finally {
      setSendingReset(false);
    }
  };

  const habits = profile.habits || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <span className={`text-xs flex items-center gap-1 transition-opacity duration-300 ${isSaving ? 'opacity-100 text-muted-foreground' : 'opacity-70 text-primary'}`}>
          {isSaving ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>
          ) : (
            <><Check className="h-3 w-3" /> Salvo automaticamente</>
          )}
        </span>
      </div>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="dados" className="flex-1">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="foto-match" className="flex-1">Foto para Match</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img src={profile.avatar_url || '/placeholder.svg'} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </label>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{user?.email ?? 'E-mail não disponível'}</span>
                </div>
                <div className="space-y-3 w-full">
                  <div>
                    <Label>Nome</Label>
                    <Input value={profile.full_name} onChange={(e) => updateProfile({ full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Curso na UFU</Label>
                    <Input value={profile.course} onChange={(e) => updateProfile({ course: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Idade</Label>
                      <Input
                        type="number"
                        min={16}
                        max={99}
                        value={profile.age}
                        onChange={(e) => updateProfile({ age: Number(e.target.value) || 18 })}
                      />
                    </div>
                    <div>
                      <Label>Período da faculdade</Label>
                      <Input
                        value={profile.college_period}
                        onChange={(e) => updateProfile({ college_period: e.target.value })}
                        placeholder="Ex: 5º período"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Campus</Label>
                    <Select value={profile.campus} onValueChange={(v) => updateProfile({ campus: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Santa Mônica', 'Umuarama', 'Pontal', 'Glória'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={handlePasswordReset}
                    disabled={sendingReset}
                  >
                    {sendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Alterar Senha
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Preferências de Hábitos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                ['organized', 'Organizado(a)'],
                ['earlyBird', 'Diurno(a)'],
                ['likesParties', 'Gosta de festas'],
                ['smokes', 'Fumante'],
                ['hasPet', 'Tem pet'],
              ] as [string, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch checked={!!habits[key]} onCheckedChange={(v) => updateHabit(key, v)} />
                </div>
              ))}
              <div>
                <Label>Estilo de estudo</Label>
                <Select value={habits.studyHabit || 'moderado'} onValueChange={(v) => updateHabit('studyHabit', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="silencioso">Silencioso</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <HabitBadges habits={habits as any} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foto-match" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Foto para Match</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Esta foto será exibida no feed de matches.</p>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={profile.match_photo_url || profile.avatar_url || '/placeholder.svg'}
                    alt="Foto para Match"
                    className="w-48 h-64 object-cover rounded-xl border-4 border-primary/20 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl" />
                </div>
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={handleMatchPhotoUpload} />
                  <Button variant="outline" className="gap-2" asChild disabled={uploading}>
                    <span>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Trocar Foto de Match
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground text-center">
                  Dica: Use uma foto sorrindo, com boa iluminação e que mostre seu rosto claramente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ao excluir sua conta, todos os seus dados, matches, mensagens e anúncios serão removidos permanentemente.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" /> Excluir Conta Permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é <strong>irreversível</strong>. Todos os seus dados, matches, mensagens e anúncios serão deletados permanentemente. Você não poderá recuperar sua conta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sim, excluir minha conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
